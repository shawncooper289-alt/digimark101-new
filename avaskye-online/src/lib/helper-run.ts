import { omitBannedLine } from "@/lib/ava/banned-line"
import { delegateWave } from "@/lib/openai/delegate"
import { avaReviewSystem, HELPER_CAP, helperSystemPrompt, helperTools, hideInternalNames, isHelperRole } from "@/lib/openai/helpers"
import { openAiChat, openAiEnv, OPENAI_FAILED_MESSAGE, OPENAI_MISSING_OWNER } from "@/lib/openai/server"
import { officeConfig, supabaseKeyHeaders } from "@/lib/office-store"

type Job = { role: string; brief: string; id?: string }

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

async function rest(path: string, init: { method: string; body?: string; prefer?: string }) {
  const { url, service } = officeConfig()
  if (!url || !service) return null
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: init.method,
    headers: supabaseKeyHeaders(service, {
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    }),
    body: init.body,
    cache: "no-store",
  })
  if (!response.ok) return null
  const text = await response.text()
  if (!text) return []
  try {
    return JSON.parse(text) as unknown
  } catch {
    return []
  }
}

async function saveResult(id: string, result: string, failed: boolean) {
  await rest(`specialist_tasks?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({
      status: failed ? "failed" : "done",
      result: clean(result).slice(0, 8000),
      finished_at: new Date().toISOString(),
    }),
  })
}

export async function runOfficeHelpers(input: { ownerId: string; jobs: { role: string; brief: string }[]; ask: string }) {
  const jobs = input.jobs.filter((job) => isHelperRole(job.role) && job.brief.trim().length > 1).slice(0, 12)
  if (jobs.length === 0) return { text: "", missing: false }
  if (!openAiEnv()) return { text: OPENAI_MISSING_OWNER, missing: true }

  const inserted = await rest("specialist_tasks", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(jobs.map((job) => ({ owner_id: input.ownerId, role: job.role, status: "queued", brief: job.brief.slice(0, 2000) }))),
  })
  const stored = Array.isArray(inserted)
  let wave: Job[] = jobs
  if (stored) {
    const claimed = await rest("rpc/claim_specialist_tasks", {
      method: "POST",
      body: JSON.stringify({ p_owner: input.ownerId, p_limit: HELPER_CAP }),
    })
    if (Array.isArray(claimed) && claimed.length > 0) {
      wave = claimed
        .filter((row): row is { id: string; role: string; brief: string } => {
          if (!row || typeof row !== "object") return false
          const item = row as { id?: unknown; role?: unknown; brief?: unknown }
          return typeof item.id === "string" && typeof item.role === "string" && typeof item.brief === "string" && isHelperRole(item.role)
        })
        .map((row) => ({ id: row.id, role: row.role, brief: row.brief }))
    }
  }

  const outcome = await delegateWave({
    jobs: wave,
    max: HELPER_CAP,
    ask: input.ask,
    context: "Founder office. Draft only. Do not send, post, or spend.",
    systemFor: helperSystemPrompt,
    toolsFor: helperTools,
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
        await saveResult(draft.job.id, draft.text || "This helper could not finish.", !draft.text)
      }),
    )
  }

  let text = outcome.text
  const waiting = stored ? jobs.length - wave.length : outcome.queued.length
  if (waiting > 0 && text && !outcome.missing && !outcome.failed) {
    text = `${text}\n\nThe rest is lined up on the Helpers page. Nothing has been sent.`
  }
  return { text: omitBannedLine(text), missing: outcome.missing }
}
