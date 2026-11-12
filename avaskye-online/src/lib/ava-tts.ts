import { BANNED_LINE_RULE, omitBannedLine } from "@/lib/ava/banned-line"
import { AVA_IDENTITY } from "@/lib/ava/identity"

const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts"
const DEFAULT_TTS_VOICE = "coral"
const DEFAULT_TTS_STYLE =
  "Speak as a warm, confident young-adult woman with a General American accent. Use a medium pitch and a moderate, conversational pace. Sound like a real person talking, not an announcer or a recording."
/** Appended to every instruction-capable OpenAI request, including an AVA_TTS_INSTRUCTIONS override. */
export const AVA_NAME_PRONUNCIATION_RULE = AVA_IDENTITY.pronunciation.rule
/** Appended the same way, so an instructions override cannot drop the preview-sentence ban. */
export const AVA_BANNED_LINE_RULE = BANNED_LINE_RULE
export const DEFAULT_TTS_INSTRUCTIONS = `${DEFAULT_TTS_STYLE} ${AVA_NAME_PRONUNCIATION_RULE} ${AVA_BANNED_LINE_RULE}`

type Env = Record<string, string | undefined>

function withRule(base: string, rule: string) {
  if (base.toLowerCase().includes(rule.toLowerCase())) return base
  return `${base} ${rule}`
}

export function ttsInstructions(env: Env) {
  const override = env.AVA_TTS_INSTRUCTIONS?.trim()
  const base = override || DEFAULT_TTS_INSTRUCTIONS
  return withRule(withRule(base, AVA_NAME_PRONUNCIATION_RULE), AVA_BANNED_LINE_RULE)
}

export function spokenForTts(text: string) {
  const cleaned = omitBannedLine(text)
    .replace(/\bAva\b/g, "Ay-vuh")
    .replace(/https?:\/\/\S+/gi, "the site")
    .replace(/[#*_`>]/g, "")
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
  if (cleaned.length <= 1400) return cleaned
  const cut = cleaned.slice(0, 1400)
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("?"), cut.lastIndexOf("!"))
  return (end > 400 ? cut.slice(0, end + 1) : cut).trim()
}

function supportsInstructions(model: string) {
  return /gpt-4o|mini-tts/i.test(model) && !/^tts-1($|-hd)/i.test(model)
}

export function ttsPlan(text: string, env: Env = process.env): {
  provider: "elevenlabs" | "openai"
  url: string
  headers: Record<string, string>
  body: string
} | null {
  const spoken = spokenForTts(text)
  if (!spoken) return null
  const elevenKey = env.ELEVENLABS_API_KEY?.trim()
  const elevenVoice = env.ELEVENLABS_VOICE_ID?.trim()
  if (elevenKey && elevenVoice) {
    return {
      provider: "elevenlabs" as const,
      url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(elevenVoice)}?output_format=mp3_44100_128`,
      headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: spoken,
        model_id: env.ELEVENLABS_MODEL?.trim() || "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    }
  }
  const key = env.AVA_TTS_API_KEY?.trim()
  if (!key) return null
  const model = env.AVA_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL
  const voice = env.AVA_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE
  const payload: Record<string, string> = { model, voice, input: spoken, response_format: "mp3" }
  if (supportsInstructions(model)) payload.instructions = ttsInstructions(env)
  const base = (env.AVA_TTS_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  return {
    provider: "openai" as const,
    url: `${base}/audio/speech`,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }
}

export async function synthesizeSpeech(text: string) {
  const plan = ttsPlan(text)
  if (!plan) return null
  try {
    const response = await fetch(plan.url, {
      method: "POST",
      headers: plan.headers,
      body: plan.body,
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) return null
    const audio = await response.arrayBuffer()
    if (audio.byteLength < 64) return null
    return { audio, provider: plan.provider, contentType: "audio/mpeg" }
  } catch {
    return null
  }
}
