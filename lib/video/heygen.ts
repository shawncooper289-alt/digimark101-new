import { VIDEO_QUALITY_POLICY, type VideoResolution } from "./quality"
import type { AspectRatio } from "./types"

export const HEYGEN_ENGINES = ["heygen-avatar-6-turbo", "heygen-avatar-6"] as const
export type HeygenEngine = (typeof HEYGEN_ENGINES)[number]

export type HeygenAvatarRequest = {
  type: "avatar"
  title: string
  avatar_id: string
  audio_url: string
  aspect_ratio: AspectRatio
  resolution: VideoResolution
  engine: { type: HeygenEngine }
  motion_prompt: string
  callback_url?: string
  callback_id?: string
}

/**
 * One Avatar 6 clip, driven by a public slice of the ElevenLabs master.
 * The ElevenLabs voice id is never sent as HeyGen's voice_id.
 */
export function heygenAvatarRequest(input: {
  title: string
  avatarId: string
  audioUrl: string
  aspect: AspectRatio
  engine: HeygenEngine
  motionPrompt: string
  callbackUrl?: string
  callbackId?: string
}): HeygenAvatarRequest | { error: string } {
  if (!input.avatarId) return { error: "Ava's avatar id is not set." }
  if (!input.audioUrl.startsWith("https://")) return { error: "HeyGen needs a public https address for the voice slice." }
  if (!HEYGEN_ENGINES.includes(input.engine)) return { error: "That avatar engine is not an Avatar 6 engine." }
  const body: HeygenAvatarRequest = {
    type: "avatar",
    title: input.title.slice(0, 120),
    avatar_id: input.avatarId,
    audio_url: input.audioUrl,
    aspect_ratio: input.aspect,
    resolution: "1080p",
    engine: { type: input.engine },
    motion_prompt: input.motionPrompt.slice(0, 500),
  }
  if (input.callbackUrl?.startsWith("https://")) {
    body.callback_url = input.callbackUrl
    if (input.callbackId) body.callback_id = input.callbackId.slice(0, 120)
  }
  return body
}

/** Prefer the configured engine when the look lists it. Otherwise take the first Avatar 6 engine the look allows. */
export function pickHeygenEngine(preferred: string, supported: string[] | undefined): HeygenEngine | "" {
  const want = preferred === "heygen-avatar-6" ? "heygen-avatar-6" : "heygen-avatar-6-turbo"
  if (!supported || supported.length === 0) return want
  if (supported.includes(want)) return want
  if (supported.includes("heygen-avatar-6-turbo")) return "heygen-avatar-6-turbo"
  if (supported.includes("heygen-avatar-6")) return "heygen-avatar-6"
  return ""
}

export function heygenCreateUrl() {
  return "https://api.heygen.com/v3/videos"
}

export function heygenStatusUrl(videoId: string) {
  return `https://api.heygen.com/v3/videos/${encodeURIComponent(videoId)}`
}

export function heygenLookUrl(lookId: string) {
  return `https://api.heygen.com/v3/avatars/looks/${encodeURIComponent(lookId)}`
}

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null
}

function pickString(source: UnknownRecord | null, keys: string[]) {
  if (!source) return ""
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function pickNumber(source: UnknownRecord | null, keys: string[]) {
  if (!source) return undefined
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return undefined
}

/** Read a HeyGen payload without inventing measurements the service did not send. */
export function readHeygenPayload(payload: unknown) {
  const root = record(payload)
  const data = record(root?.data) || root
  const error = record(root?.error)
  const duration = pickNumber(data, ["duration", "duration_seconds"])
  const durationMs = pickNumber(data, ["video_duration_ms", "duration_ms", "videoDurationMs"])
  const engines = Array.isArray(data?.supported_api_engines)
    ? data.supported_api_engines.filter((item): item is string => typeof item === "string")
    : undefined
  return {
    videoId: pickString(data, ["video_id", "id"]),
    status: pickString(data, ["status"]).toLowerCase(),
    resolution: pickString(data, ["resolution"]),
    resolutionNote: pickString(data, ["resolution_note", "resolutionNote"]),
    width: pickNumber(data, ["width"]),
    height: pickNumber(data, ["height"]),
    fps: pickNumber(data, ["fps"]),
    videoDurationMs: durationMs ?? (typeof duration === "number" ? Math.round(duration * 1000) : undefined),
    audioDurationMs: pickNumber(data, ["audio_duration_ms", "audioDurationMs"]),
    lipSyncOffsetMs: pickNumber(data, ["lip_sync_offset_ms", "lipSyncOffsetMs"]),
    blackFrameCount: pickNumber(data, ["black_frame_count", "blackFrameCount"]),
    frozenSeconds: pickNumber(data, ["frozen_seconds", "frozenSeconds"]),
    videoUrl: pickString(data, ["video_url", "url", "download_url"]),
    subtitleUrl: pickString(data, ["subtitle_url", "caption_url"]),
    callbackId: pickString(data, ["callback_id", "callbackId"]),
    supportedEngines: engines,
    errorMessage: pickString(error, ["message"]) || pickString(data, ["error", "failure_message", "message"]),
  }
}

export function fourKRejected(message: string) {
  return /4k|2160|resolution/i.test(message) && /not|unsupported|unavailable|plan|upgrade|invalid/i.test(message)
}

export { VIDEO_QUALITY_POLICY }
