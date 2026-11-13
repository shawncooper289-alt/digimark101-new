import { VIDEO_QUALITY_POLICY, type VideoResolution } from "./quality"
import type { Scene, VideoProject } from "./types"

export type HeygenScene = {
  type: "avatar_video"
  input: {
    type: "avatar"
    avatar_id: string
    script: string
    voice_id: string
    voice_settings: {
      speed: number
      locale: string
      engine_settings: {
        engine_type: "elevenlabs"
        model: typeof VIDEO_QUALITY_POLICY.ttsModel
        stability: number
      }
    }
    engine: { type: typeof VIDEO_QUALITY_POLICY.avatarEngine }
    motion_prompt: string
    background: { type: "color"; color: string }
  }
}

export type HeygenRequest = {
  type: "studio"
  title: string
  aspect_ratio: VideoProject["brief"]["aspect"]
  resolution: VideoResolution
  caption: { file_format: "srt"; style: "default" }
  scenes: HeygenScene[]
}

function motionPrompt(scene: Scene) {
  return [
    scene.transition,
    scene.camera,
    scene.lighting,
    scene.visual,
    "Same face as the Let's get started avatar. Smooth motion. Keep the picture moving. No black frame.",
  ].join(" ")
}

export function heygenBody(project: VideoProject, resolution: VideoResolution): HeygenRequest | { error: string } {
  const talking = project.scenes.filter((scene) => scene.talking)
  if (!talking.length) return { error: "This style has no talking scene to lip-sync." }
  if (talking.length > VIDEO_QUALITY_POLICY.maxScenes) return { error: "That storyboard is longer than the render limit of 50 scenes." }
  if (talking.some((scene) => !scene.avatarId || !scene.voiceId)) {
    return { error: "Every talking scene needs the same avatar and the same voice." }
  }
  return {
    type: "studio",
    title: project.title.slice(0, 120),
    aspect_ratio: project.brief.aspect,
    resolution,
    caption: { file_format: "srt", style: "default" },
    scenes: talking.map((scene) => ({
      type: "avatar_video",
      input: {
        type: "avatar",
        avatar_id: scene.avatarId,
        script: scene.spoken,
        voice_id: scene.voiceId,
        voice_settings: {
          speed: 1,
          locale: "en-US",
          engine_settings: {
            engine_type: "elevenlabs",
            model: VIDEO_QUALITY_POLICY.ttsModel,
            stability: 0.5,
          },
        },
        engine: { type: VIDEO_QUALITY_POLICY.avatarEngine },
        motion_prompt: motionPrompt(scene),
        background: { type: "color", color: project.brief.brand.primary },
      },
    })),
  }
}

export function heygenCreateUrl() {
  return "https://api.heygen.com/v3/videos"
}

export function heygenStatusUrl(videoId: string) {
  return `https://api.heygen.com/v3/videos/${encodeURIComponent(videoId)}`
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

/** Read a HeyGen create or status payload without assuming one nesting shape. */
export function readHeygenPayload(payload: unknown) {
  const root = record(payload)
  const data = record(root?.data) || root
  const videoId = pickString(data, ["video_id", "id"])
  const status = pickString(data, ["status"]).toLowerCase()
  const resolution = pickString(data, ["resolution"])
  const resolutionNote = pickString(data, ["resolution_note", "resolutionNote"])
  const width = pickNumber(data, ["width"])
  const height = pickNumber(data, ["height"])
  const fps = pickNumber(data, ["fps"])
  const duration = pickNumber(data, ["duration", "duration_seconds"])
  const durationMs = pickNumber(data, ["video_duration_ms", "duration_ms", "videoDurationMs"])
  const audioMs = pickNumber(data, ["audio_duration_ms", "audioDurationMs"])
  const lip = pickNumber(data, ["lip_sync_offset_ms", "lipSyncOffsetMs"])
  const black = pickNumber(data, ["black_frame_count", "blackFrameCount"])
  const frozen = pickNumber(data, ["frozen_seconds", "frozenSeconds"])
  const error = record(root?.error)
  const errorMessage = pickString(error, ["message"]) || pickString(data, ["error", "failure_message"])
  return {
    videoId,
    status,
    resolution,
    resolutionNote,
    width,
    height,
    fps: fps ?? (status ? VIDEO_QUALITY_POLICY.heygenAvatarFps : undefined),
    videoDurationMs: durationMs ?? (typeof duration === "number" ? Math.round(duration * 1000) : undefined),
    audioDurationMs: audioMs,
    lipSyncOffsetMs: lip ?? null,
    blackFrameCount: black,
    frozenSeconds: frozen,
    videoUrl: pickString(data, ["video_url", "url", "download_url"]),
    subtitleUrl: pickString(data, ["subtitle_url", "caption_url"]),
    errorMessage,
  }
}

export function fourKRejected(message: string) {
  return /4k|2160|resolution/i.test(message) && /not|unsupported|unavailable|plan|upgrade|invalid/i.test(message)
}
