import "server-only"

import { ToolFailure, executeTool } from "@/lib/ava/tools/effects"
import { AVA_TOOLS, toolByApiName } from "@/lib/ava/tools/registry"
import { isTeamTool, releaseApprovedTool, runTeamTool } from "@/lib/ava/team/execute"
import { runTeamAgent, type TeamRunResult } from "@/lib/ava/team/run"
import { lookupTools } from "@/lib/ava/team/scope"
import { isTeamSlug } from "@/lib/ava/team/profiles"
import { readTrafficProviders } from "@/lib/ava/team/providers"
import { TeamMigrationNeeded, type TeamStore } from "@/lib/ava/team/store"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { specialistChat } from "@/lib/ava/team/specialist-chat"
import { site } from "@/lib/site"
import type { SupabaseClient } from "@supabase/supabase-js"

function lookup() {
  return lookupTools(AVA_TOOLS.map((tool) => ({ apiName: tool.apiName, name: tool.name, effect: tool.effect })))
}

function toolsFor(allow: readonly string[]) {
  return allow.map((name) => ({ name }))
}

async function chat(input: { system: string; user: string; tools: { name: string }[] }) {
  const specs = lookup()
  const defs = input.tools.flatMap((tool) => {
    const spec = specs(tool.name)
    if (!spec) return []
    return [{
      type: "function",
      function: {
        name: spec.apiName,
        description: "Team tool. Stay inside this list.",
        parameters: { type: "object", properties: { goal: { type: "string" }, topic: { type: "string" }, body: { type: "string" }, audience: { type: "string" }, url: { type: "string" }, platform: { type: "string" } } },
      },
    }]
  })
  const result = await specialistChat({
    temperature: 0.3,
    maxTokens: 700,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    tools: defs,
  })
  if (!result.ok) return { ok: false as const, reason: result.reason, message: result.message }
  return {
    ok: true as const,
    text: result.text,
    toolCalls: result.toolCalls.map((call) => ({ name: call.name, arguments: call.arguments })),
    tokensIn: result.usage?.input ?? 0,
    tokensOut: result.usage?.output ?? 0,
  }
}

export function teamStoreOrNull() {
  return supabaseTeamStore()
}

export async function executeDuringRun(input: {
  store: TeamStore
  supabase: SupabaseClient
  ownerId: string
  slug: import("@/lib/ava/team/profiles").TeamSlug
  runId: string | null
  name: string
  args: Record<string, unknown>
}) {
  if (isTeamTool(input.name)) {
    const ran = await runTeamTool({
      name: input.name,
      args: input.args,
      store: input.store,
      ownerId: input.ownerId,
      slug: input.slug,
      runId: input.runId,
      siteUrl: site.url,
      fetchImpl: fetch,
    })
    return ran ?? { summary: "That tool is not available." }
  }
  const spec = toolByApiName(input.name)
  if (!spec || spec.effect === "outbound" || spec.effect === "destructive") {
    return { summary: "That waits for the owner. Nothing was sent, posted, or charged." }
  }
  try {
    const outcome = await executeTool(input.supabase, spec, input.ownerId, input.args)
    return { summary: outcome.summary }
  } catch (error) {
    const message = error instanceof ToolFailure ? error.message : "Could not use that tool."
    return { summary: message }
  }
}

export async function startTeamRun(input: {
  ownerId: string
  actorId: string
  slug: string
  brief: unknown
  idempotencyKey?: string
  supabase: SupabaseClient
  store?: TeamStore | null
  extraSources?: string[]
}): Promise<TeamRunResult & { migration?: boolean }> {
  const store = input.store ?? supabaseTeamStore(input.supabase)
  if (!store || !isTeamSlug(input.slug)) {
    return { ok: false, runId: null, status: "failed", text: "The team desk is not configured.", paused: false, approvals: 0, denied: [], missing: false, reused: false }
  }
  const slug = input.slug
  try {
    const holder = { runId: null as string | null }
    const result = await runTeamAgent({
      ownerId: input.ownerId,
      actorId: input.actorId,
      slug,
      brief: input.brief,
      idempotencyKey: input.idempotencyKey,
      store,
      chat,
      lookup: lookup(),
      toolsFor,
      extraSources: input.extraSources,
      onRun: (runId) => {
        holder.runId = runId
      },
      execute: async (name, args) => executeDuringRun({
        store,
        supabase: input.supabase,
        ownerId: input.ownerId,
        slug,
        runId: holder.runId,
        name,
        args,
      }),
    })
    return result
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) {
      return { ok: false, runId: null, status: "failed", text: error.message, paused: false, approvals: 0, denied: [], missing: false, reused: false, migration: true }
    }
    throw error
  }
}

export async function releaseApproval(input: {
  supabase: SupabaseClient
  ownerId: string
  tool: string
  params: Record<string, unknown>
}) {
  return releaseApprovedTool({
    tool: input.tool,
    params: input.params,
    fetchImpl: fetch,
    siteUrl: site.url,
    schedulePost: async (params) => {
      const spec = toolByApiName("social_publish")
      if (!spec) return { summary: "Scheduling is not available. Nothing was published." }
      try {
        const outcome = await executeTool(input.supabase, spec, input.ownerId, params)
        return { summary: outcome.summary }
      } catch (error) {
        return { summary: error instanceof ToolFailure ? error.message : "Nothing was published." }
      }
    },
    queueCampaign: async (params) => {
      const spec = toolByApiName("campaigns_send")
      if (!spec) return { summary: "The queue is not available. Nothing was sent." }
      try {
        const outcome = await executeTool(input.supabase, spec, input.ownerId, params)
        return { summary: outcome.summary }
      } catch (error) {
        return { summary: error instanceof ToolFailure ? error.message : "Nothing was sent." }
      }
    },
  })
}

export async function pullTrafficKpis(ownerId: string, store: TeamStore) {
  const rows = await readTrafficProviders(process.env, fetch)
  if (!rows.length) return 0
  return store.addKpis(ownerId, rows)
}

export async function drainQueuedTeam(limit = 10) {
  const store = supabaseTeamStore()
  const admin = (await import("@/lib/supabase/admin")).createSupabaseAdmin()
  if (!store || !admin) return { ok: false as const, reason: "unconfigured" as const, finished: 0 }
  try {
    const queued = await store.queuedRuns(limit)
    let finished = 0
    for (const run of queued) {
      await runTeamAgent({
        ownerId: run.ownerId,
        actorId: run.ownerId,
        slug: run.slug,
        brief: run.brief,
        idempotencyKey: run.idempotencyKey ?? undefined,
        resumeRun: run,
        store,
        chat,
        lookup: lookup(),
        toolsFor,
        onRun: () => undefined,
        execute: async (name, args) => executeDuringRun({
          store,
          supabase: admin,
          ownerId: run.ownerId,
          slug: run.slug,
          runId: run.id,
          name,
          args,
        }),
      })
      finished += 1
    }
    return { ok: true as const, finished }
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return { ok: false as const, reason: "migration" as const, finished: 0 }
    throw error
  }
}
