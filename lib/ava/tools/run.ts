import "server-only"

import { executeTool, ToolFailure, type ToolRow } from "@/lib/ava/tools/effects"
import type { PageContext } from "@/lib/ava/tools/page"
import { authorize, confirmationCopy, resolveRole } from "@/lib/ava/tools/permissions"
import { toolByApiName, toolByName } from "@/lib/ava/tools/registry"
import { isOwnerIdentity, isWorkspaceId } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

export type ToolResult = {
  ok: boolean
  status: number
  summary: string
  rows: ToolRow[]
  pending?: { name: string; args: Record<string, unknown>; summary: string }
}

function cleanArgs(value: unknown) {
  if (!value || typeof value !== "object") return {}
  const args: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === "workspaceId" || key === "confirmed") continue
    if (/token|secret|password|card|cvv|cvc|pan/i.test(key)) continue
    if (typeof item === "string" || typeof item === "number") args[key] = item
  }
  return args
}

async function writeAudit(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServer>>>, input: {
  actorId: string
  ownerId: string
  tool: string
  effect: string
  status: "denied" | "pending" | "executed"
  pagePath: string
  detail: string
}) {
  const { error } = await client.from("ava_audit_log").insert({
    actor_id: input.actorId,
    owner_id: input.ownerId,
    tool: input.tool,
    effect: input.effect,
    status: input.status,
    page_path: input.pagePath.slice(0, 200),
    detail: { summary: input.detail.slice(0, 500) },
  })
  return error
}

export async function runTool(input: {
  name: string
  args?: Record<string, unknown>
  confirmed?: boolean
  page?: PageContext | null
}): Promise<ToolResult> {
  const spec = toolByName(input.name) ?? toolByApiName(input.name)
  if (!spec) return { ok: false, status: 400, summary: "That tool is not available.", rows: [] }
  const session = await createSupabaseServer()
  const user = session ? (await session.auth.getUser()).data.user : null
  if (!session || !user) {
    return { ok: false, status: 401, summary: "Sign in to use Ava on this workspace.", rows: [] }
  }
  const args = cleanArgs(input.args)
  const requested = typeof input.args?.workspaceId === "string" ? input.args.workspaceId : ""
  const platformOwner = isOwnerIdentity(user)
  let client = session
  let ownerId = user.id
  if (requested && requested !== user.id) {
    if (!platformOwner || !isWorkspaceId(requested)) {
      return { ok: false, status: 403, summary: "That workspace is outside your account.", rows: [] }
    }
    const admin = createSupabaseAdmin()
    if (!admin) return { ok: false, status: 503, summary: "Switching workspaces needs the server key. Nothing was changed.", rows: [] }
    client = admin
    ownerId = requested
  }
  const role = resolveRole({
    signedIn: true,
    isDataOwner: ownerId === user.id,
    isPlatformOwner: platformOwner,
    membership: null,
  })
  const decision = authorize(spec.name, {
    role,
    confirmed: input.confirmed === true,
    workspaceMatch: true,
    isPlatformOwner: platformOwner,
  })
  const pagePath = input.page?.path ?? spec.page
  if (!decision.allow) {
    await writeAudit(client, { actorId: user.id, ownerId, tool: spec.name, effect: spec.effect, status: "denied", pagePath, detail: decision.reason })
    return { ok: false, status: 403, summary: decision.reason, rows: [] }
  }
  if (decision.needsConfirmation) {
    const summary = confirmationCopy(spec.name)
    const auditError = await writeAudit(client, { actorId: user.id, ownerId, tool: spec.name, effect: spec.effect, status: "pending", pagePath, detail: summary })
    if (auditError && (spec.effect === "outbound" || spec.effect === "destructive")) {
      return { ok: false, status: 503, summary: "Apply supabase/migrations/20261119_feature_parity.sql before a send, delete, or payment request. Nothing was sent or charged.", rows: [] }
    }
    return { ok: true, status: 200, summary, rows: [], pending: { name: spec.name, args, summary } }
  }
  try {
    if (spec.effect === "outbound" || spec.effect === "destructive") {
      const gate = await writeAudit(client, { actorId: user.id, ownerId, tool: spec.name, effect: spec.effect, status: "pending", pagePath, detail: "Confirmed. Starting." })
      if (gate) {
        return { ok: false, status: 503, summary: "Apply supabase/migrations/20261119_feature_parity.sql before a send, delete, or payment request. Nothing was sent or charged.", rows: [] }
      }
    }
    const outcome = await executeTool(client, spec, ownerId, args)
    await writeAudit(client, { actorId: user.id, ownerId, tool: spec.name, effect: spec.effect, status: "executed", pagePath, detail: outcome.summary })
    return { ok: true, status: 200, summary: outcome.summary, rows: outcome.rows }
  } catch (error) {
    const message = error instanceof ToolFailure ? error.message : "Could not update this workspace."
    const status = error instanceof ToolFailure ? error.status : 502
    return { ok: false, status, summary: message, rows: [] }
  }
}
