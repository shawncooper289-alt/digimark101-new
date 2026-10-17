import { NextResponse } from "next/server"
import { commitAction, loadWorkspace } from "@/lib/platform/db"
import { emptyWorkspace, type Action, type Stage, type Trigger, type AutomationAction } from "@/lib/platform/types"
import { automationActions, stages, triggers } from "@/lib/platform/types"
import { sameOrigin } from "@/lib/http"
import { ensureOwnerGranted, isOwnerIdentity, isWorkspaceId, listWorkspaces } from "@/lib/owner/access"
import { supabasePublicConfig } from "@/lib/supabase/config"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

function parseAction(value: unknown): Action | null {
  if (!value || typeof value !== "object") return null
  const action = value as Action
  switch (action.type) {
    case "create_contact":
      return typeof action.name === "string" ? action : null
    case "create_deal":
      return typeof action.title === "string" ? action : null
    case "move_deal":
      return typeof action.title === "string" && stages.includes(action.stage as Stage) ? action : null
    case "book_appointment":
      return typeof action.startsAt === "string" ? action : null
    case "log_message":
      return typeof action.body === "string" ? action : null
    case "start_campaign":
      return typeof action.name === "string" ? action : null
    case "create_site":
      return typeof action.name === "string" ? action : null
    case "create_automation":
      return triggers.includes(action.trigger as Trigger) && automationActions.includes(action.action as AutomationAction) ? action : null
    case "remember":
      return typeof action.key === "string" && typeof action.value === "string" ? action : null
    default:
      return null
  }
}

export async function GET(request: Request) {
  const configured = Boolean(supabasePublicConfig())
  const { supabase, user } = await currentUser()
  if (!supabase || !user) {
    return NextResponse.json({ mode: "preview", configured, email: null, workspace: null, isOwner: false, workspaces: [] })
  }
  const owner = await ensureOwnerGranted(user)
  if (owner) await supabase.auth.refreshSession()
  const requested = new URL(request.url).searchParams.get("workspace")
  const workspaceId = owner && isWorkspaceId(requested) ? requested : user.id
  const client = owner && workspaceId !== user.id ? createSupabaseAdmin() ?? supabase : supabase
  try {
    const workspace = await loadWorkspace(client, workspaceId)
    const workspaces = owner ? await listWorkspaces(user) : []
    const active = workspaces.find((item) => item.id === workspaceId)
    return NextResponse.json({
      mode: "account",
      configured,
      email: user.email ?? null,
      workspace,
      isOwner: owner,
      unrestricted: owner,
      workspaceId,
      workspaceLabel: active?.label ?? "Your workspace",
      workspaces,
    })
  } catch (error) {
    return NextResponse.json({
      mode: "account",
      configured,
      email: user.email ?? null,
      workspace: emptyWorkspace(),
      isOwner: owner,
      unrestricted: owner,
      workspaceId: user.id,
      workspaceLabel: "Your workspace",
      workspaces: owner ? [{ id: user.id, label: "Your workspace" }] : [],
      error: error instanceof Error ? error.message : "Could not load the workspace. Run supabase/migrations/20261015_platform.sql.",
    })
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const { supabase, user } = await currentUser()
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to save to your workspace." }, { status: 401 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 })
  }
  const record = body && typeof body === "object" ? (body as { action?: unknown; workspaceId?: unknown }) : {}
  const action = parseAction(record.action)
  if (!action) return NextResponse.json({ error: "That action is not supported." }, { status: 400 })
  const owner = isOwnerIdentity(user)
  const requested = typeof record.workspaceId === "string" ? record.workspaceId : ""
  const workspaceId = owner && isWorkspaceId(requested) ? requested : user.id
  const client = owner && workspaceId !== user.id ? createSupabaseAdmin() ?? supabase : supabase
  try {
    const result = await commitAction(client, workspaceId, action)
    const workspace = await loadWorkspace(client, workspaceId)
    return NextResponse.json({ summary: result.summary, workspace, workspaceId })
  } catch (error) {
    console.error("Studio action failed", error instanceof Error ? error.name : "error")
    return NextResponse.json({ error: "Could not save that to your workspace." }, { status: 502 })
  }
}
