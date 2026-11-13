import { omitBannedLine } from "@/lib/ava/banned-line"
import { avaProvider } from "@/lib/ava/respond"
import {
  actionsFromCalls,
  localSpecialistDraft,
  MAX_CONCURRENT_SPECIALISTS,
  presentAsAva,
  runWithCap,
  specialistSystemPrompt,
  specialistTools,
  type SpecialistJob,
  type SpecialistRoleId,
} from "@/lib/ava/specialists"
import type { Action } from "@/lib/platform/types"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

type ToolCall = { name: string; arguments: Record<string, unknown> }

async function draftJob(job: SpecialistJob, context: string): Promise<{ text: string; calls: ToolCall[] }> {
  const local = localSpecialistDraft(job.role, job.brief)
  const provider = avaProvider()
  if (!provider) return { text: local, calls: [] }
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: specialistSystemPrompt(job.role) },
          { role: "user", content: `Brief:\n${job.brief}\n\nWorkspace context:\n${context || "No extra facts."}` },
        ],
        tools: specialistTools(job.role),
        tool_choice: "auto",
      }),
    })
    if (!response.ok) return { text: local, calls: [] }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }>
    }
    const message = data.choices?.[0]?.message
    const text = typeof message?.content === "string" ? omitBannedLine(message.content.trim()) : ""
    const calls: ToolCall[] = []
    for (const call of message?.tool_calls ?? []) {
      const name = call.function?.name
      if (!name) continue
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function?.arguments || "{}") as Record<string, unknown>
      } catch {
        args = {}
      }
      calls.push({ name, arguments: args })
    }
    return { text: text || local, calls }
  } catch {
    return { text: local, calls: [] }
  }
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
      result: result.slice(0, 8000),
      finished_at: new Date().toISOString(),
    })
    .eq("id", id)
}

export async function runSpecialistJobs(input: {
  ownerId: string | null
  jobs: SpecialistJob[]
  context?: string
}): Promise<{ text: string; pending: Action[]; stored: boolean; queued: number }> {
  if (input.jobs.length === 0) {
    return { text: "", pending: [], stored: false, queued: 0 }
  }
  const context = input.context || ""
  const pending: Action[] = []
  const parts: string[] = []
  const storedRows = input.ownerId ? await persistQueued(input.ownerId, input.jobs) : null

  if (storedRows && input.ownerId) {
    let guard = 0
    let claimFailed = false
    while (guard < 8) {
      guard += 1
      const claimed = await claimStored(input.ownerId)
      if (!claimed) {
        claimFailed = true
        break
      }
      if (claimed.length === 0) break
      await Promise.all(
        claimed.map(async (task) => {
          const drafted = await draftJob({ role: task.role, brief: task.brief }, context)
          pending.push(...actionsFromCalls(task.role, drafted.calls))
          parts.push(drafted.text)
          await saveResult(task.id, drafted.text, false)
        }),
      )
    }
    if (claimFailed && parts.length === 0) {
      await runWithCap(input.jobs, MAX_CONCURRENT_SPECIALISTS, async (job) => {
        const drafted = await draftJob(job, context)
        pending.push(...actionsFromCalls(job.role, drafted.calls))
        parts.push(drafted.text)
      })
    }
    const admin = createSupabaseAdmin()
    const left = admin
      ? await admin
          .from("specialist_tasks")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", input.ownerId)
          .eq("status", "queued")
      : null
    return {
      text: presentAsAva(parts),
      pending,
      stored: true,
      queued: left?.count ?? 0,
    }
  }

  await runWithCap(input.jobs, MAX_CONCURRENT_SPECIALISTS, async (job) => {
    const drafted = await draftJob(job, context)
    pending.push(...actionsFromCalls(job.role, drafted.calls))
    parts.push(drafted.text)
  })
  return { text: presentAsAva(parts), pending, stored: false, queued: 0 }
}

/** Finish jobs that were left queued because six helpers were already busy. */
export async function drainSpecialistQueue(limitOwners = 20) {
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
          const drafted = await draftJob({ role: task.role, brief: task.brief }, "Queued earlier. Use only this brief.")
          await saveResult(task.id, drafted.text, false)
          finished += 1
        }),
      )
    }
  }
  return { ok: true as const, finished }
}
