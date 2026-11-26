export const DEFAULT_FAL_MODEL = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video"
export const ACE_STEP_MODEL = "fal-ai/ace-step/prompt-to-audio"

const FAL_RATES: Record<string, number> = {
  "fal-ai/kling-video/v2.5-turbo/pro/text-to-video": 0.07,
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video": 0.07,
  "fal-ai/kling-video/v3/pro/text-to-video": 0.14,
  "fal-ai/veo3.1/fast": 0.15,
  "alibaba/wan-3.0/text-to-video": 0.05,
  "fal-ai/wan/v2.2-a14b/text-to-video": 0.1,
}

export function falModelRate(model: string) {
  return FAL_RATES[model] ?? 0.07
}

export function falQueueUrl(model: string) {
  return `https://queue.fal.run/${model.replace(/^\/+/, "")}`
}

export function falRequestUrl(model: string, requestId: string) {
  return `${falQueueUrl(model)}/requests/${encodeURIComponent(requestId)}`
}

export function klingBody(input: { prompt: string; durationMs: number; aspect: string; imageUrl?: string }) {
  const seconds = Math.round(input.durationMs / 1000)
  const duration = seconds >= 8 ? "10" : "5"
  const body: Record<string, unknown> = {
    prompt: input.prompt.slice(0, 2000),
    duration,
    aspect_ratio: input.aspect,
  }
  if (input.imageUrl?.startsWith("https://")) body.image_url = input.imageUrl
  return body
}

export function aceStepBody(input: { title: string; durationMs: number }) {
  const seconds = Math.max(10, Math.min(240, Math.round(input.durationMs / 1000) || 30))
  return {
    prompt: `Warm sparse instrumental for "${input.title.slice(0, 80)}". Soft piano, light pulse, no vocals, no lyrics, sitting under a spoken voice-over.`,
    duration: seconds,
    instrumental: true,
  }
}
