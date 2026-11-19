/**
 * Premium-only video policy.
 * This object is frozen. Callers, env vars, and model tools cannot lower it.
 * A finished video is delivered only after the quality gate passes.
 * Anything below this bar is a labeled preview draft, or it is not delivered.
 */
export const VIDEO_QUALITY_POLICY = Object.freeze({
  id: "premium-only" as const,
  locked: true as const,
  minShortEdge: 1080,
  preferredResolution: "1080p" as const,
  /**
   * Finished films are assembled at 1080p.
   * HeyGen Studio does not accept 4K. Avatar 6 can go to 2K, which we do not
   * request, because it blows the cost target. Grok reference shots top out at 720p
   * and are scaled into the 1080p cut.
   */
  acceptedResolutions: Object.freeze(["1080p"] as const),
  rejectedResolutions: Object.freeze(["720p", "480p", "360p", "4k"] as const),
  /**
   * HeyGen avatar video is documented at 25 fps. That is the highest rate that
   * product renders. Frame-accurate means the lip-sync offset stays inside one
   * frame at the delivered rate. Providers that accept an fps field are asked
   * for preferredFps, never for a rate below minFps.
   */
  heygenAvatarFps: 25,
  preferredFps: 60,
  minFps: 25,
  maxLipSyncFrames: 1,
  durationToleranceMs: 80,
  captionDriftMs: 100,
  maxFrozenSeconds: 0.4,
  maxBlackFrames: 0,
  maxAttempts: 3,
  /** Highest-quality ElevenLabs speech model. Turbo and Flash are refused for finished films. */
  ttsModel: "eleven_v4" as const,
  ttsOutputFormat: "mp3_44100_192" as const,
  /** Avatar 6 Turbo is the default on-camera engine. Pro is heygen-avatar-6. */
  avatarEngine: "heygen-avatar-6-turbo" as const,
  avatarEnginePro: "heygen-avatar-6" as const,
  /** Grok Imagine 1.5 is the default cinematic B-roll model. */
  grokBrollModel: "grok-imagine-video-1.5" as const,
  grokLiteModel: "grok-imagine-video-1.5-lite" as const,
  /** Reference-to-video on Grok 1.5 is documented at 720p. Text-to-video can be native 1080p. */
  grokReferenceResolution: "720p" as const,
  grokPlateResolution: "1080p" as const,
  costCapUsd: 25,
  costFloorUsd: 15,
  /** Never hold a frozen last frame to pad a scene. */
  playbackMode: "fit_to_scene" as const,
  maxScenes: 50,
  minSceneSeconds: 2.2,
  transitionSeconds: 0.4,
  maxDurationSeconds: 480,
})

export type VideoResolution = "1080p"

const DOWNGRADE_KEYS = [
  "quality",
  "resolution",
  "fps",
  "model",
  "ttsModel",
  "engine",
  "playback",
  "bitrate",
] as const

export function frameBudgetMs(fps: number) {
  const rate = fps > 0 ? fps : VIDEO_QUALITY_POLICY.heygenAvatarFps
  return 1000 / rate
}

/** Drop any client or agent field that tries to pick a cheaper render. */
export function stripQualityOverrides(input: Record<string, unknown>) {
  const ignored: string[] = []
  const brief: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if ((DOWNGRADE_KEYS as readonly string[]).includes(key)) {
      ignored.push(key)
      continue
    }
    brief[key] = value
  }
  return { brief, ignored }
}

export function resolutionMeetsFloor(resolution: string | undefined, shortEdge: number | undefined) {
  if (resolution && (VIDEO_QUALITY_POLICY.rejectedResolutions as readonly string[]).includes(resolution)) return false
  if (typeof shortEdge === "number" && shortEdge > 0 && shortEdge < VIDEO_QUALITY_POLICY.minShortEdge) return false
  if (resolution === "1080p") return true
  if (typeof shortEdge === "number" && shortEdge >= VIDEO_QUALITY_POLICY.minShortEdge) return true
  return false
}

export function isFastTtsModel(model: string) {
  return /turbo|flash|low_lat|tts-1($|-hd)?/i.test(model)
}
