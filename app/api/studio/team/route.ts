import { handoffFromArgs } from "@/lib/ava/team/execute"
import { decideOwnerApproval, rejectOwnerApproval } from "@/lib/ava/team/run"
import { reviewMuseResult } from "@/lib/ava/team/muse"
import { parseBrief } from "@/lib/ava/team/brief"
import { isTeamSlug } from "@/lib/ava/team/profiles"
import { releaseApproval, startTeamRun } from "@/lib/ava/team/server-run"
import { monthStart, TeamMigrationNeeded } from "@/lib/ava/team/store"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { teamDeskData } from "@/lib/ava/team/view"
import { isOwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

async function ownerContext() {
  const { user } = await currentUser()
  if (!isOwnerIdentity(user) || !user?.id) return null
  const admin = createSupabaseAdmin()
  const store = admin ? supabaseTeamStore(admin) : null
  if (!admin || !store) return { userId: user.id, admin: null, store: null }
  return { userId: user.id, admin, store }
}

export async function GET() {
  const ctx = await ownerContext()
  if (!ctx) return Response.json({ error: "Only the owner can open the team desk." }, { status: 403 })
  if (!ctx.store) {
    return Response.json(teamDeskData({
      ready: false,
      message: "The server key is not set, so the desk cannot load stored work.",
      profiles: [],
      runs: [],
      approvals: [],
      handoffs: [],
      spentMicro: 0,
    }))
  }
  try {
    await ctx.store.ensureProfiles(ctx.userId)
    const [profiles, runs, approvals, handoffs, usage] = await Promise.all([
      ctx.store.listProfiles(ctx.userId),
      ctx.store.listRuns(ctx.userId),
      ctx.store.listApprovals(ctx.userId),
      ctx.store.listHandoffs(ctx.userId),
      ctx.store.usageSince(ctx.userId, "traffic", new Date(0).toISOString(), monthStart(new Date())),
    ])
    return Response.json(teamDeskData({ ready: true, profiles, runs, approvals, handoffs, spentMicro: usage.totalMonthMicro }))
  } catch (error) {
    const message = error instanceof TeamMigrationNeeded ? error.message : "The team desk could not be loaded."
    return Response.json(teamDeskData({ ready: false, message, profiles: [], runs: [], approvals: [], handoffs: [], spentMicro: 0 }))
  }
}

export async function POST(request: Request) {
  const ctx = await ownerContext()
  if (!ctx) return Response.json({ error: "Only the owner can change the team desk." }, { status: 403 })
  if (!ctx.admin || !ctx.store) return Response.json({ error: "The server key is not set. Nothing was changed." }, { status: 503 })
  const body = await request.json().catch(() => null)
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {}
  const action = typeof record.action === "string" ? record.action : ""
  try {
    if (action === "dispatch") {
      const slug = typeof record.slug === "string" ? record.slug : ""
      if (!isTeamSlug(slug)) return Response.json({ error: "That agent is not on the team." }, { status: 400 })
      const result = await startTeamRun({
        ownerId: ctx.userId,
        actorId: ctx.userId,
        slug,
        brief: record,
        idempotencyKey: typeof record.idempotencyKey === "string" ? record.idempotencyKey : undefined,
        supabase: ctx.admin,
        store: ctx.store,
      })
      return Response.json(result, { status: result.ok ? 200 : 400 })
    }
    if (action === "approve" || action === "reject") {
      const id = typeof record.id === "string" ? record.id : ""
      if (action === "reject") return Response.json(await rejectOwnerApproval({ store: ctx.store, ownerId: ctx.userId, approvalId: id }))
      const decided = await decideOwnerApproval({
        store: ctx.store,
        ownerId: ctx.userId,
        actorId: ctx.userId,
        approvalId: id,
        execute: (tool, params) => releaseApproval({ supabase: ctx.admin!, ownerId: ctx.userId, tool, params }),
      })
      return Response.json(decided)
    }
    if (action === "resume") {
      const slug = typeof record.slug === "string" ? record.slug : ""
      if (!isTeamSlug(slug)) return Response.json({ error: "That agent is not on the team." }, { status: 400 })
      await ctx.store.setPaused(ctx.userId, slug, false, null)
      return Response.json({ ok: true })
    }
    if (action === "muse_brief") {
      const handoff = handoffFromArgs(ctx.userId, record)
      if (!handoff) return Response.json({ error: "A Muse brief needs a goal." }, { status: 400 })
      const saved = await ctx.store.addHandoff(handoff)
      return Response.json({ ok: true, id: saved.id, briefText: saved.briefText })
    }
    if (action === "muse_result") {
      const id = typeof record.id === "string" ? record.id : ""
      const result = typeof record.result === "string" ? record.result.trim().slice(0, 20000) : ""
      const handoff = await ctx.store.getHandoff(ctx.userId, id)
      if (!handoff) return Response.json({ error: "That brief is not on this desk." }, { status: 404 })
      const brief = parseBrief(handoff)
      const review = brief ? reviewMuseResult(result, brief) : { text: "Held. Nothing was published." }
      await ctx.store.updateHandoff(id, { status: "reviewed", museResult: result, avaReview: review.text })
      return Response.json({ ok: true, review: review.text })
    }
    return Response.json({ error: "Unknown action." }, { status: 400 })
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return Response.json({ error: error.message }, { status: 503 })
    throw error
  }
}
