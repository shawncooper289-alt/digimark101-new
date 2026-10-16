import { NextResponse } from "next/server"
import { commitAction, loadWorkspace } from "@/lib/platform/db"
import { emptyWorkspace, type Action, type Stage, type Trigger, type AutomationAction } from "@/lib/platform/types"
import { automationActions, stages, triggers } from "@/lib/platform/types"
import { sameOrigin } from "@/lib/http"
import { supabasePublicConfig } from "@/lib/supabase/config"
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

export async function GET() {
  const configured = Boolean(supabasePublicConfig())
  const { supabase, user } = await currentUser()
  if (!supabase || !user) {
    return NextResponse.json({ mode: "preview", configured, email: null, workspace: null })
  }
  try {
    const workspace = await loadWorkspace(supabase, user.id)
    return NextResponse.json({ mode: "account", configured, email: user.email ?? null, workspace })
  } catch (error) {
    return NextResponse.json({
      mode: "account",
      configured,
      email: user.email ?? null,
      workspace: emptyWorkspace(),
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
  const action = parseAction(body && typeof body === "object" && "action" in body ? (body as { action: unknown }).action : null)
  if (!action) return NextResponse.json({ error: "That action is not supported." }, { status: 400 })
  try {
    const result = await commitAction(supabase, user.id, action)
    const workspace = await loadWorkspace(supabase, user.id)
    return NextResponse.json({ summary: result.summary, workspace })
  } catch (error) {
    console.error("Studio action failed", error instanceof Error ? error.name : "error")
    return NextResponse.json({ error: "Could not save that to your workspace." }, { status: 502 })
  }
}
