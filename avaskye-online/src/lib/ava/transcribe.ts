import { transcriptText } from "@/lib/ava/transcript"

export const SCRIBE_MODEL = "scribe_v2"
export const OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe"

type Env = Record<string, string | undefined>

export type TranscribePlan = {
  provider: "elevenlabs" | "openai"
  url: string
  headers: Record<string, string>
  model: string
}

export function transcribePlan(env: Env = process.env): TranscribePlan | null {
  const eleven = env.ELEVENLABS_API_KEY?.trim()
  if (eleven) {
    return {
      provider: "elevenlabs",
      url: "https://api.elevenlabs.io/v1/speech-to-text",
      headers: { "xi-api-key": eleven },
      model: env.ELEVENLABS_STT_MODEL?.trim() || SCRIBE_MODEL,
    }
  }
  const key = env.OPENAI_API_KEY?.trim()
  if (!key) return null
  const base = (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  return {
    provider: "openai",
    url: `${base}/audio/transcriptions`,
    headers: { Authorization: `Bearer ${key}` },
    model: env.OPENAI_TRANSCRIBE_MODEL?.trim() || OPENAI_TRANSCRIBE_MODEL,
  }
}

async function requestTranscript(plan: TranscribePlan, file: Blob, filename: string) {
  const body = new FormData()
  body.append("file", file, filename)
  if (plan.provider === "elevenlabs") {
    body.append("model_id", plan.model)
    body.append("language_code", "en")
    body.append("tag_audio_events", "false")
    body.append("keyterms", "Ava Skye")
    body.append("keyterms", "DigiMark101")
  } else {
    body.append("model", plan.model)
    body.append("language", "en")
  }
  const response = await fetch(plan.url, {
    method: "POST",
    headers: plan.headers,
    body,
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) return null
  const data = (await response.json().catch(() => null)) as { text?: unknown } | null
  return transcriptText(typeof data?.text === "string" ? data.text : "")
}

export async function transcribeAudio(file: Blob, filename: string, env: Env = process.env) {
  if (env.ELEVENLABS_API_KEY?.trim()) {
    const plan = transcribePlan(env)
    if (plan?.provider === "elevenlabs") {
      try {
        const text = await requestTranscript(plan, file, filename)
        if (text) return { text, provider: "elevenlabs" as const }
      } catch {
        // OpenAI transcription is the next try.
      }
    }
  }
  if (!env.OPENAI_API_KEY?.trim()) return null
  const plan = transcribePlan({ ...env, ELEVENLABS_API_KEY: undefined })
  if (!plan) return null
  try {
    const text = await requestTranscript(plan, file, filename)
    if (!text) return null
    return { text, provider: "openai" as const }
  } catch {
    return null
  }
}
