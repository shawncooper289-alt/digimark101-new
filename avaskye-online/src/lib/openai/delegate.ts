/**
 * Run helper jobs with a hard cap. Extra jobs stay queued.
 * The chat function is injected so tests can mock OpenAI.
 * This file has no app imports so the office can keep an identical copy.
 */

export type DelegateJob = { role: string; brief: string }

export type DelegateToolCall = { name: string; arguments: string }

export type DelegateChatResult =
  | { ok: true; text: string; toolCalls?: DelegateToolCall[] }
  | { ok: false; reason: "missing" | "failed"; message: string }

export type DelegateChat = (input: {
  system: string
  user: string
  tools?: unknown[]
}) => Promise<DelegateChatResult>

export type DelegateDraft<T extends DelegateJob> = {
  job: T
  text: string
  toolCalls: DelegateToolCall[]
}

/**
 * Never more than `max` workers at once.
 * Returns the highest number that were in flight together.
 */
export async function runAtMost<T>(items: T[], max: number, worker: (item: T) => Promise<void>) {
  const limit = Math.max(1, max)
  let active = 0
  let index = 0
  let peak = 0
  if (items.length === 0) return 0
  await new Promise<void>((resolve, reject) => {
    const launch = () => {
      if (index >= items.length && active === 0) {
        resolve()
        return
      }
      while (active < limit && index < items.length) {
        const item = items[index]
        index += 1
        active += 1
        peak = Math.max(peak, active)
        worker(item).then(() => {
          active -= 1
          launch()
        }, reject)
      }
    }
    launch()
  })
  return peak
}

export async function delegateWave<T extends DelegateJob>(input: {
  jobs: T[]
  max: number
  ask: string
  context: string
  systemFor: (role: string) => string
  toolsFor: (role: string) => unknown[]
  chat: DelegateChat
  reviewSystem: string
  clean: (text: string) => string
  missingMessage: string
  failedMessage: string
}): Promise<{
  text: string
  ran: T[]
  queued: T[]
  peak: number
  drafts: DelegateDraft<T>[]
  missing: boolean
  failed: boolean
}> {
  const max = Math.max(1, input.max)
  const ran = input.jobs.slice(0, max)
  const queued = input.jobs.slice(max)
  const slots: Array<DelegateDraft<T> | undefined> = new Array(ran.length)
  let missing = false

  const peak = await runAtMost(
    ran.map((job, index) => ({ job, index })),
    max,
    async (item) => {
      const result = await input.chat({
        system: input.systemFor(item.job.role),
        user: `Brief:\n${item.job.brief}\n\nWorkspace context:\n${input.context || "No extra facts."}`,
        tools: input.toolsFor(item.job.role),
      })
      if (!result.ok) {
        if (result.reason === "missing") missing = true
        slots[item.index] = { job: item.job, text: "", toolCalls: [] }
        return
      }
      slots[item.index] = {
        job: item.job,
        text: input.clean(result.text),
        toolCalls: result.toolCalls ?? [],
      }
    },
  )

  const drafts = slots.filter((slot): slot is DelegateDraft<T> => Boolean(slot))
  if (missing) {
    return { text: input.missingMessage, ran, queued, peak, drafts, missing: true, failed: false }
  }

  const usable = drafts.filter((draft) => draft.text)
  if (usable.length === 0) {
    return { text: input.failedMessage, ran, queued, peak, drafts, missing: false, failed: true }
  }

  const review = await input.chat({
    system: input.reviewSystem,
    user: `The person asked:\n${input.ask}\n\nDraft notes:\n${usable.map((draft, index) => `${index + 1}. ${draft.text}`).join("\n\n")}`,
  })
  if (!review.ok) {
    if (review.reason === "missing") {
      return { text: input.missingMessage, ran, queued, peak, drafts, missing: true, failed: false }
    }
    const fallback = input.clean(usable.map((draft) => draft.text).join("\n\n"))
    return {
      text: fallback || input.failedMessage,
      ran,
      queued,
      peak,
      drafts,
      missing: false,
      failed: !fallback,
    }
  }
  const text = input.clean(review.text) || input.clean(usable.map((draft) => draft.text).join("\n\n"))
  return { text, ran, queued, peak, drafts, missing: false, failed: !text }
}
