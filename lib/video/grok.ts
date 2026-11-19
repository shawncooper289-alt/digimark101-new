import { VIDEO_QUALITY_POLICY } from "./quality"
import type { AspectRatio } from "./types"

export type GrokModel = "grok-imagine-video-1.5" | "grok-imagine-video-1.5-lite"

export type GrokVideoRequest = {
  model: GrokModel
  prompt: string
  duration: number
  aspect_ratio: AspectRatio
  resolution: "1080p" | "720p" | "480p"
  generate_audio: boolean
  reference_images?: { url: string }[]
}

/**
 * Grok Imagine request.
 * Reference shots are 720p because that is the documented ceiling for reference-to-video.
 * Text-to-video plates ask for native 1080p on the full model.
 * Custom voice files are partner-only, so this never sends Ava's recording as a voice reference.
 */
export function grokVideoRequest(input: {
  model: GrokModel
  prompt: string
  durationMs: number
  aspect: AspectRatio
  referenceUrls: string[]
  withAudio: boolean
}): GrokVideoRequest {
  const references = input.model === "grok-imagine-video-1.5" ? input.referenceUrls.slice(0, 14) : []
  const usingReferences = references.length > 0
  const resolution = input.model === "grok-imagine-video-1.5-lite"
    ? "720p"
    : usingReferences
      ? VIDEO_QUALITY_POLICY.grokReferenceResolution
      : VIDEO_QUALITY_POLICY.grokPlateResolution
  const body: GrokVideoRequest = {
    model: input.model,
    prompt: input.prompt.slice(0, 4000),
    duration: Math.max(1, Math.min(15, Math.round(input.durationMs / 1000) || 8)),
    aspect_ratio: input.aspect,
    resolution,
    generate_audio: input.withAudio,
  }
  if (usingReferences) body.reference_images = references.map((url) => ({ url }))
  return body
}

export function grokCreateUrl() {
  return "https://api.x.ai/v1/videos/generations"
}

export function grokStatusUrl(requestId: string) {
  return `https://api.x.ai/v1/videos/${encodeURIComponent(requestId)}`
}

export function grokRatePerSecond(model: GrokModel, resolution: "1080p" | "720p" | "480p") {
  if (model === "grok-imagine-video-1.5-lite") {
    if (resolution === "1080p") return 0.14
    if (resolution === "720p") return 0.03
    return 0.02
  }
  if (resolution === "1080p") return 0.25
  if (resolution === "720p") return 0.14
  return 0.08
}
