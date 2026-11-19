import { costTable } from "./cost"
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
  return Boolean(env.FAL_KEY?.trim() || (env.VIDEO_MUSIC_API_KEY?.trim() && env.VIDEO_MUSIC_API_URL?.trim()))
}

export function xaiKey(env: Env) {
  return env.XAI_API_KEY?.trim() || ""
}

export function falKey(env: Env) {
  return env.FAL_KEY?.trim() || env.VIDEO_BROLL_API_KEY?.trim() || ""
}

export function referenceImageUrls(env: Env) {
  return (env.AVA_REFERENCE_IMAGE_URLS || env.AVA_REFERENCE_IMAGES || "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("https://"))
    .slice(0, 14)
}

export function heygenEngine(env: Env) {
  return env.VIDEO_HEYGEN_ENGINE?.trim() === "heygen-avatar-6" ? "heygen-avatar-6" : "heygen-avatar-6-turbo"
}

export function grokModel(env: Env) {
  return env.VIDEO_GROK_MODEL?.trim() === VIDEO_QUALITY_POLICY.grokLiteModel
    ? VIDEO_QUALITY_POLICY.grokLiteModel
    : VIDEO_QUALITY_POLICY.grokBrollModel
}

export function talkingProvider(env: Env): "heygen" | "grok" | "none" {
  const choice = env.VIDEO_TALKING_PROVIDER?.trim() || "heygen"
  if (choice === "grok") return xaiKey(env) ? "grok" : "none"
  if (heygenKey(env) && env.AVA_AVATAR_ID?.trim()) return "heygen"
  return "none"
}

/** Grok is the default B-roll provider. fal.ai is used only when VIDEO_BROLL_PROVIDER=fal. */
export function brollProvider(env: Env): "grok" | "fal" | "none" {
  if (env.VIDEO_BROLL_PROVIDER?.trim() === "fal") return falKey(env) ? "fal" : "none"
  return xaiKey(env) ? "grok" : "none"
}

export function falModel(env: Env) {
  return env.VIDEO_FAL_MODEL?.trim() || "fal-ai/kling-video/v2.5-turbo/pro/text-to-video"
}

export function lipsyncEnabled(env: Env) {
  return env.VIDEO_LIPSYNC_PASS?.trim() === "on" && Boolean(env.SYNC_API_KEY?.trim())
}

export function elevenKey(env: Env) {
  return env.ELEVENLABS_API_KEY?.trim() || ""
}

export function supabaseConfigured(env: Env) {
  const url = env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim() || env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL?.trim() || ""
  return Boolean(url && env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

export function storageNote() {
  return "Finished films are stored in a private Supabase bucket named videos. The Free plan stops at 50 MB per file and 1 GB total. A 3.5 minute 1080p film is usually larger than 50 MB, so the Pro plan is required before the first real film can be saved."
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
  const talking = talkingProvider(env)
  const broll = brollProvider(env)
  const missing: string[] = []
  if (talking !== "grok" && !voiceId) missing.push("Ava's voice id (AVA_VOICE_CLONE_ID, or ELEVENLABS_VOICE_ID until the clone exists)")
  if (talking !== "grok" && !elevenKey(env)) missing.push("ElevenLabs (ELEVENLABS_API_KEY)")
  if (talking === "none") missing.push("An on-camera camera (HEYGEN_API_KEY and AVA_AVATAR_ID, or VIDEO_TALKING_PROVIDER=grok with XAI_API_KEY)")
  if (!avatar && talking !== "grok") missing.push("Ava's avatar id from the Let's get started clip (AVA_AVATAR_ID)")
  if (broll === "none") missing.push("Cinematic B-roll (XAI_API_KEY, or VIDEO_BROLL_PROVIDER=fal with FAL_KEY)")
  if (!supabaseConfigured(env)) missing.push("The video library (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)")
  const finalReady = missing.length === 0
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
        ? "A finished film can be requested. It is published only after you approve it."
        : "A finished film waits until the missing pieces above are connected. A preview draft still works.",
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
        ? "A quiet music bed can be added under the voice."
        : "Music is not connected. Add FAL_KEY and the film is cut without a soundtrack. Nothing fake is added.",
    },
    broll: {
      ready: brollProvider(env) !== "none",
      provider: brollProvider(env),
      model: brollProvider(env) === "fal" ? falModel(env) : brollProvider(env) === "grok" ? grokModel(env) : "",
      note: brollProvider(env) === "grok"
        ? "Grok Imagine is the cinematic B-roll camera. Ava reference photos keep her face consistent. Reference shots are 720p, which is that model's ceiling, and they are placed in a 1080p film."
        : brollProvider(env) === "fal"
          ? "fal.ai is filming the B-roll. Switch back by clearing VIDEO_BROLL_PROVIDER."
          : "Cinematic B-roll is not connected. Add XAI_API_KEY for Grok Imagine, or set VIDEO_BROLL_PROVIDER=fal and FAL_KEY.",
    },
    talking: {
      provider: talkingProvider(env),
      engine: talkingProvider(env) === "heygen" ? heygenEngine(env) : talkingProvider(env) === "grok" ? grokModel(env) : "",
      note: talkingProvider(env) === "grok"
        ? "Grok is filming Ava on camera. It cannot use her own voice recording unless xAI has approved this account as a partner, so the voice will not match her ElevenLabs clone."
        : talkingProvider(env) === "heygen"
          ? "HeyGen Avatar 6 films Ava, using her ElevenLabs voice so the voice stays hers."
          : "Ava's on-camera camera is not connected. Add HEYGEN_API_KEY and AVA_AVATAR_ID.",
    },
    lipsync: {
      ready: lipsyncEnabled(env),
      note: lipsyncEnabled(env)
        ? "An optional lip-sync pass runs only on cutaways where Ava speaks."
        : "The optional lip-sync pass is off. Set SYNC_API_KEY and VIDEO_LIPSYNC_PASS=on to use it on cutaways. It is not required for HeyGen, which already lip-syncs her voice.",
    },
    references: {
      count: referenceImageUrls(env).length,
      note: referenceImageUrls(env).length
        ? "Ava reference photos are set."
        : "No Ava reference photos yet. Add AVA_REFERENCE_IMAGE_URLS (https links, up to 14) so Grok can keep her face.",
    },
    library: {
      ready: supabaseConfigured(env),
      note: supabaseConfigured(env)
        ? "Jobs and films are saved in Supabase. Closing the browser does not stop a job."
        : "The video library is not connected. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Preview drafts still work on this page.",
    },
    storage: storageNote(),
    cost: costTable().map((row) => ({ id: row.id, label: row.label, usd: row.usd, withinTarget: row.withinTarget, lines: row.lines })),
    grokVoiceLimit: "Grok can lip-sync speech, but a voice reference made from Ava's own recording is partner-only. Her on-camera voice stays on ElevenLabs through HeyGen unless you deliberately switch VIDEO_TALKING_PROVIDER to grok.",
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
