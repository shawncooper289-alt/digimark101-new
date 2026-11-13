import { omitBannedLine } from "@/lib/ava/banned-line"
import {
  actionsFromCalls,
  isSpecialistRole,
  MAX_CONCURRENT_SPECIALISTS,
  specialistSystemPrompt,
  specialistTools,
  type SpecialistJob,
  type SpecialistRoleId,
} from "@/lib/ava/specialists"
import { delegateWave } from "@/lib/openai/delegate"
import { avaReviewSystem, hideInternalNames } from "@/lib/openai/helpers"
import { openAiChat, openAiEnv, OPENAI_FAILED_MESSAGE, OPENAI_MISSING_OWNER } from "@/lib/openai/server"
import type { Action } from "@/lib/platform/types"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

type StoredJob = SpecialistJob & { id?: string }

function clean(text: string) {
  return hideInternalNames(omitBannedLine(text))
}

async function modelChat(input: { system: string; user: string; tools?: unknown[] }) {
  const result = await openAiChat({
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    tools: input.tools,
    temperature: 0.4,
    maxTokens: 700,
  })
  if (!result.ok) return result
  return { ok: true as const, text: result.text, toolCalls: result.toolCalls }
}

async function persistQueued(ownerId: string, jobs: SpecialistJob[]) {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const rows = jobs.map((job) => ({
    owner_id: ownerId,
    role: job.role,
    status: "queued",
    brief: job.brief,
  }))
  const { data, error } = await admin.from("specialist_tasks").insert(rows).select("id, role, brief, status")
  if (error || !data) return null
  return data as { id: string; role: SpecialistRoleId; brief: string; status: string }[]
}

async function claimStored(ownerId: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const { data, error } = await admin.rpc("claim_specialist_tasks", {
    p_owner: ownerId,
    p_limit: MAX_CONCURRENT_SPECIALISTS,
  })
  if (error || !Array.isArray(data)) return null
  return data as { id: string; role: SpecialistRoleId; brief: string }[]
}

async function saveResult(id: string, result: string, failed: boolean) {
  const admin = createSupabaseAdmin()
  if (!admin) return
  await admin
    .from("specialist_tasks")
    .update({
      status: failed ? "failed" : "done",
      result: clean(result).slice(0, 8000),
      finished_at: new Date().toISOString(),
    })
    .eq("id", id)
}

async function countQueued(ownerId: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return 0
  const left = await admin
    .from("specialist_tasks")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "queued")
  return left.count ?? 0
}

function callsFrom(toolCalls: { name: string; arguments: string }[]) {
  return toolCalls.map((call) => {
    let args: Record<string, unknown> = {}
    try {
      const parsed = JSON.parse(call.arguments || "{}") as unknown
      if (parsed && typeof parsed === "object") args = parsed as Record<string, unknown>
    } catch {
      args = {}
    }
    return { name: call.name, arguments: args }
  })
}

export async function runSpecialistJobs(input: {
  ownerId: string | null
  jobs: SpecialistJob[]
  context?: string
  ask?: string
}): Promise<{ text: string; pending: Action[]; stored: boolean; queued: number; missing: boolean }> {
  if (input.jobs.length === 0) {
    return { text: "", pending: [], stored: false, queued: 0, missing: false }
  }
  if (!openAiEnv()) {
    return { text: OPENAI_MISSING_OWNER, pending: [], stored: false, queued: input.jobs.length, missing: true }
  }

  const ask = input.ask?.trim() || input.jobs.map((job) => job.brief).join("\n")
  const context = input.context || ""
  const storedRows = input.ownerId ? await persistQueued(input.ownerId, input.jobs) : null
  let jobs: StoredJob[] = input.jobs
  let stored = false

  if (storedRows && input.ownerId) {
    stored = true
    const claimed = await claimStored(input.ownerId)
    if (!claimed) {
      return {
        text: "This work is lined up. Nothing was made up, and nothing was sent.",
        pending: [],
        stored: true,
        queued: input.jobs.length,
        missing: false,
      }
    }
    if (claimed.length === 0) {
      return {
        text: "That work is waiting in line. Nothing was sent.",
        pending: [],
        stored: true,
        queued: input.jobs.length,
        missing: false,
      }
    }
    jobs = claimed
      .filter((row) => isSpecialistRole(row.role))
      .map((row) => ({ id: row.id, role: row.role, brief: row.brief }))
  }

  const outcome = await delegateWave({
    jobs,
    max: MAX_CONCURRENT_SPECIALISTS,
    ask,
    context,
    systemFor: (role) => (isSpecialistRole(role) ? specialistSystemPrompt(role) : ""),
    toolsFor: (role) => (isSpecialistRole(role) ? specialistTools(role) : []),
    chat: modelChat,
    reviewSystem: avaReviewSystem(),
    clean,
    missingMessage: OPENAI_MISSING_OWNER,
    failedMessage: OPENAI_FAILED_MESSAGE,
  })

  if (stored) {
    await Promise.all(
      outcome.drafts.map(async (draft) => {
        if (!draft.job.id) return
        const failed = !draft.text
        await saveResult(draft.job.id, draft.text || "This helper could not finish.", failed)
      }),
    )
  }

  if (outcome.missing) {
    return { text: OPENAI_MISSING_OWNER, pending: [], stored, queued: outcome.queued.length, missing: true }
  }

  const pending: Action[] = []
  for (const draft of outcome.drafts) {
    if (!isSpecialistRole(draft.job.role)) continue
    pending.push(...actionsFromCalls(draft.job.role, callsFrom(draft.toolCalls)))
  }

  const queued = stored && input.ownerId ? await countQueued(input.ownerId) : outcome.queued.length
  let text = outcome.text
  if (queued > 0 && text && !outcome.failed) {
    const extra = stored
      ? "The rest is lined up. I will bring it back in my own words. Nothing has been sent."
      : "I finished the first batch. Sign in if you want the rest kept in line. Nothing has been sent."
    text = `${text}\n\n${extra}`
  }
  return { text: omitBannedLine(text), pending, stored, queued, missing: false }
}

/** Finish jobs that were left queued because six helpers were already busy. */
export async function drainSpecialistQueue(limitOwners = 20) {
  if (!openAiEnv()) return { ok: false as const, reason: "missing" as const }
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, reason: "unconfigured" as const }
  const { data, error } = await admin.from("specialist_tasks").select("owner_id").eq("status", "queued").limit(100)
  if (error) return { ok: false as const, reason: "unread" as const }
  const owners = [...new Set((data ?? []).map((row) => String(row.owner_id)))].slice(0, limitOwners)
  let finished = 0
  for (const ownerId of owners) {
    let guard = 0
    while (guard < 8) {
      guard += 1
      const claimed = await claimStored(ownerId)
      if (!claimed?.length) break
      await Promise.all(
        claimed.map(async (task) => {
          if (!isSpecialistRole(task.role)) {
            await saveResult(task.id, "This helper could not finish.", true)
            finished += 1
            return
          }
          const drafted = await modelChat({
            system: specialistSystemPrompt(task.role),
            user: `Brief:\n${task.brief}\n\nWorkspace context:\nQueued earlier. Use only this brief.`,
            tools: specialistTools(task.role),
          })
          if (!drafted.ok) {
            await saveResult(task.id, drafted.message, true)
          } else {
            await saveResult(task.id, drafted.text, false)
          }
          finished += 1
        }),
      )
    }
  }
  return { ok: true as const, finished }
}
