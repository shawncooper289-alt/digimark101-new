import { VIDEO_QUALITY_POLICY } from "./quality"
import type { AttireId } from "./types"
import { isHexColor } from "./text"

export type Env = Record<string, string | undefined>

export const LIGHTING = "Soft key light, warm, dark studio. The same exposure on every cut."

export const ATTIRE_OPTIONS: { id: AttireId; label: string }[] = [
  { id: "navy-blazer", label: "Navy blazer" },
  { id: "black-suit", label: "Black suit" },
  { id: "tailored-jacket", label: "Tailored jacket" },
]

const CAMERA = [
  "Slow push-in. Keep the move smooth and short.",
  "Gentle drift to the side. Do not change the light.",
  "Settle and hold a steady frame while the line lands.",
  "Slight rise. Stay on the same face and the same wardrobe.",
] as const

const TRANSITION = "Dissolve from the previous shot over a short beat. No flash cut and no exposure jump."

export function cameraMove(index: number) {
  return CAMERA[index % CAMERA.length]
}

export function transitionFor(index: number) {
  return index === 0 ? "Fade in from black over a short beat. Then stay in the same light." : TRANSITION
}

/** Instant Voice Clone wins over the temporary premade ElevenLabs voice. */
export function resolvedElevenVoiceId(env: Env) {
  return env.AVA_VOICE_CLONE_ID?.trim() || env.ELEVENLABS_VOICE_ID?.trim() || ""
}

export function videoVoiceId(env: Env) {
  return resolvedElevenVoiceId(env) || env.VIDEO_VOICE_ID?.trim() || ""
}

export function voiceLabel(env: Env) {
  if (env.AVA_VOICE_CLONE_ID?.trim()) return "Instant Voice Clone"
  if (env.ELEVENLABS_VOICE_ID?.trim()) return "Temporary premade voice"
  if (env.VIDEO_VOICE_ID?.trim()) return "Video voice"
  return "No voice id yet"
}

type LookMap = Partial<Record<AttireId, string>>

export function avatarLooks(env: Env): LookMap {
  const raw = env.AVA_AVATAR_LOOKS?.trim()
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const looks: LookMap = {}
    for (const item of ATTIRE_OPTIONS) {
      const id = parsed[item.id]
      if (typeof id === "string" && id.trim()) looks[item.id] = id.trim()
    }
    return looks
  } catch {
    return {}
  }
}

/** Ava's face stays on the Let's get started avatar. Attire can point at another look of that same person. */
export function avaAvatarId(env: Env, attire: AttireId) {
  const looks = avatarLooks(env)
  return looks[attire] || env.AVA_AVATAR_ID?.trim() || ""
}

export type StockItem = { label: string; id: string; note: string }

function stockList(raw: string | undefined): StockItem[] {
  if (!raw?.trim()) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return []
      const row = item as Record<string, unknown>
      const label = typeof row.label === "string" ? row.label.trim() : ""
      const id = typeof row.id === "string" ? row.id.trim() : ""
      if (!label || !id) return []
      const note = typeof row.note === "string" ? row.note.trim() : "Ready-made option. No usage numbers are attached."
      return [{ label, id, note }]
    })
  } catch {
    return []
  }
}

export function stockAvatars(env: Env) {
  return stockList(env.VIDEO_STOCK_AVATARS)
}

export function stockVoices(env: Env) {
  return stockList(env.VIDEO_STOCK_VOICES)
}

export function stockAvatarId(env: Env, label: string) {
  return stockAvatars(env).find((item) => item.label === label)?.id || ""
}

export function heygenKey(env: Env) {
  return env.HEYGEN_API_KEY?.trim() || (env.VIDEO_LIPSYNC_PROVIDER?.trim() === "heygen" ? env.VIDEO_LIPSYNC_API_KEY?.trim() || "" : "")
}

export function lipsyncProvider(env: Env): "heygen" | "generic" | "none" {
  const choice = env.VIDEO_LIPSYNC_PROVIDER?.trim()
  if (choice === "generic" && genericLipsync(env)) return "generic"
  if (choice === "heygen" && heygenKey(env)) return "heygen"
  if (!choice && env.HEYGEN_API_KEY?.trim()) return "heygen"
  if (!choice && genericLipsync(env)) return "generic"
  return "none"
}

export function genericLipsync(env: Env) {
  const provider = env.VIDEO_LIPSYNC_PROVIDER?.trim() || ""
  const key = env.VIDEO_LIPSYNC_API_KEY?.trim() || ""
  const url = env.VIDEO_LIPSYNC_API_URL?.trim() || ""
  if (provider === "generic" && key && url) return { key, url }
  return null
}

export function brollReady(env: Env) {
  return Boolean(env.VIDEO_BROLL_API_KEY?.trim() && env.VIDEO_BROLL_API_URL?.trim())
}

export function musicReady(env: Env) {
  return Boolean(env.VIDEO_MUSIC_API_KEY?.trim() && env.VIDEO_MUSIC_API_URL?.trim())
}

export function defaultBrand(primary?: string, accent?: string, font?: string, logoUrl?: string) {
  return {
    primary: primary && isHexColor(primary) ? primary : "#14181a",
    accent: accent && isHexColor(accent) ? accent : "#cbb082",
    font: font?.trim().slice(0, 40) || "Georgia",
    logoUrl: logoUrl?.trim() || "",
  }
}

export function capabilityReport(env: Env) {
  const clone = Boolean(env.AVA_VOICE_CLONE_ID?.trim())
  const premade = Boolean(env.ELEVENLABS_VOICE_ID?.trim())
  const voiceId = videoVoiceId(env)
  const avatar = Boolean(env.AVA_AVATAR_ID?.trim())
  const heygen = Boolean(heygenKey(env))
  const generic = Boolean(genericLipsync(env))
  const finalReady = Boolean(voiceId && avatar && (heygen || generic))
  const missing: string[] = []
  if (!voiceId) missing.push("A voice id (AVA_VOICE_CLONE_ID, or ELEVENLABS_VOICE_ID until the clone exists)")
  if (!avatar) missing.push("Ava's avatar id from the Let's get started clip (AVA_AVATAR_ID)")
  if (!heygen && !generic) missing.push("A video avatar key (HEYGEN_API_KEY, or VIDEO_LIPSYNC_PROVIDER=generic with a key and URL)")
  return {
    policy: VIDEO_QUALITY_POLICY.id,
    locked: VIDEO_QUALITY_POLICY.locked,
    minShortEdge: VIDEO_QUALITY_POLICY.minShortEdge,
    preferredResolution: VIDEO_QUALITY_POLICY.preferredResolution,
    ttsModel: VIDEO_QUALITY_POLICY.ttsModel,
    avatarEngine: VIDEO_QUALITY_POLICY.avatarEngine,
    fpsNote: `Avatar renders use the provider's highest documented rate (${VIDEO_QUALITY_POLICY.heygenAvatarFps} fps on HeyGen). Lip sync must land inside one frame.`,
    final: {
      ready: finalReady,
      missing,
      note: finalReady
        ? "A finished video can be requested. It is delivered only after the quality checks pass."
        : "Pro feature: a finished video unlocks when the avatar, voice, and video keys are set. No preview is substituted for it.",
    },
    preview: {
      ready: true,
      label: "Preview draft",
      note: "A preview draft is a branded slideshow with captions. It is not lip-synced and it is not a finished video.",
    },
    voice: {
      mode: clone ? "clone" : premade || env.VIDEO_VOICE_ID?.trim() ? "stand-in" : "missing",
      label: voiceLabel(env),
      note: clone
        ? "The Instant Voice Clone is the voice for finished videos."
        : "The premade voice is a temporary stand-in. Set AVA_VOICE_CLONE_ID and it takes over. No code change.",
    },
    music: {
      ready: musicReady(env),
      note: musicReady(env)
        ? "A music bed can be requested with the video."
        : "Pro feature: a soundtrack unlocks when a music key and URL are set. Silence is not filled with a fake track.",
    },
    broll: {
      ready: brollReady(env),
      note: brollReady(env)
        ? "Cinematic and animated plates can be requested."
        : "Pro feature: cinematic B-roll and animated plates unlock when a video model key and URL are set.",
    },
    stockAvatars: stockAvatars(env).map((item) => ({ label: item.label, note: item.note })),
    stockVoices: stockVoices(env).map((item) => ({ label: item.label, note: item.note })),
    attire: ATTIRE_OPTIONS.map((item) => ({
      id: item.id,
      label: item.label,
      connected: Boolean(avatarLooks(env)[item.id] || env.AVA_AVATAR_ID?.trim()),
    })),
    avatarSource: "2026-11-11 Let's get started clip. The face does not change. Only a business outfit may change.",
  }
}
