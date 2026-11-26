import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ToolSpec } from "@/lib/ava/tools/registry"
import { approvalExpiry, approvalHash } from "@/lib/ava/team/approvals"
import { handoffFromArgs, profileCards, runTeamTool } from "@/lib/ava/team/execute"
import { decideOwnerApproval, rejectOwnerApproval } from "@/lib/ava/team/run"
import { isTeamSlug } from "@/lib/ava/team/profiles"
import { budgetMeter } from "@/lib/ava/team/budget"
import { monthStart, TeamMigrationNeeded } from "@/lib/ava/team/store"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { releaseApproval, startTeamRun } from "@/lib/ava/team/server-run"
import type { ToolRow } from "@/lib/ava/tools/effects"

const OWNER_TOOLS = new Set(["team_dispatch", "team_status", "team_approve", "muse_brief", "team_reject"])

export async function handleOwnerTool(
  supabase: SupabaseClient,
  spec: ToolSpec,
  ownerId: string,
  args: Record<string, unknown>,
): Promise<{ summary: string; rows: ToolRow[] } | null> {
  const store = supabaseTeamStore(supabase)
  if (!store) return { summary: "The team desk needs the server key. Nothing was changed.", rows: [] }
  try {
    if (spec.apiName === "team_dispatch") {
      const slug = typeof args.slug === "string" ? args.slug : ""
      if (!isTeamSlug(slug)) return { summary: "Name one of the five team roles.", rows: [] }
      const result = await startTeamRun({
        ownerId,
        actorId: ownerId,
        slug,
        brief: args,
        idempotencyKey: typeof args.idempotencyKey === "string" ? args.idempotencyKey : undefined,
        supabase,
        store,
      })
      return { summary: result.text, rows: result.runId ? [{ id: result.runId, title: slug, meta: result.status }] : [] }
    }
    if (spec.apiName === "team_status") {
      await store.ensureProfiles(ownerId)
      const [profiles, usage] = await Promise.all([
        store.listProfiles(ownerId),
        store.usageSince(ownerId, "traffic", new Date(0).toISOString(), monthStart(new Date())),
      ])
      const meter = budgetMeter(usage.totalMonthMicro)
      const rows = profileCards().map((card) => {
        const live = profiles.find((profile) => profile.slug === card.slug)
        return { id: card.slug, title: card.title, meta: live?.paused ? "paused" : card.autonomy }
      })
      return { summary: `Team spend ${meter.label}.`, rows }
    }
    if (spec.apiName === "team_approve" || spec.apiName === "team_reject") {
      const id = typeof args.id === "string" ? args.id : ""
      if (!id) return { summary: "An approval id is required.", rows: [] }
      if (spec.apiName === "team_reject") {
        const rejected = await rejectOwnerApproval({ store, ownerId, approvalId: id })
        return { summary: rejected.reason, rows: [] }
      }
      const decided = await decideOwnerApproval({
        store,
        ownerId,
        actorId: ownerId,
        approvalId: id,
        execute: async (tool, params) => releaseApproval({ supabase, ownerId, tool, params }),
      })
      return { summary: decided.reason, rows: [] }
    }
    if (spec.apiName === "muse_brief") {
      const handoff = handoffFromArgs(ownerId, args)
      if (!handoff) return { summary: "A Muse brief needs a goal.", rows: [] }
      const saved = await store.addHandoff(handoff)
      return { summary: "The Muse brief is on the team desk. Copy it from there. Nothing was sent to Muse.", rows: [{ id: saved.id, title: "Muse brief", meta: "open" }] }
    }
    if (!OWNER_TOOLS.has(spec.apiName)) {
      if (spec.effect === "outbound" || spec.effect === "destructive") {
        const target = typeof args.id === "string" ? args.id : typeof args.url === "string" ? args.url : ""
        const saved = await store.addApproval({
          ownerId,
          actorId: ownerId,
          runId: null,
          tool: spec.apiName,
          target: target.slice(0, 200),
          params: args,
          paramsHash: approvalHash({ tool: spec.apiName, target: target.slice(0, 200), params: args }),
          effect: spec.effect,
          expiresAt: approvalExpiry(new Date()),
        })
        return { summary: "It is in the owner inbox. Nothing was sent, posted, or charged.", rows: [{ id: saved.id, title: spec.name, meta: "pending" }] }
      }
      const slug = isTeamSlug(spec.module) ? spec.module : "traffic"
      const ran = await runTeamTool({ name: spec.apiName, args, store, ownerId, slug })
      return ran ? { summary: ran.summary, rows: [] } : null
    }
    return null
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return { summary: error.message, rows: [] }
    throw error
  }
}
