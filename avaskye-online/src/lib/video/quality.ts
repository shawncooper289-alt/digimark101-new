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
  preferredResolution: "4k" as const,
  /** 1080p is the floor. 4K is requested whenever the provider accepts it. */
  acceptedResolutions: Object.freeze(["4k", "1080p"] as const),
  rejectedResolutions: Object.freeze(["720p", "480p", "360p"] as const),
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
  /** Highest-quality ElevenLabs speech model. Turbo and Flash are refused. */
  ttsModel: "eleven_v4" as const,
  ttsOutputFormat: "mp3_44100_192" as const,
  /** Avatar V is HeyGen's highest-fidelity lip-sync engine. */
  avatarEngine: "avatar_v" as const,
  /** Never hold a frozen last frame to pad a scene. */
  playbackMode: "fit_to_scene" as const,
  maxScenes: 50,
  minSceneSeconds: 2.2,
  transitionSeconds: 0.4,
  maxDurationSeconds: 480,
})

export type VideoResolution = "4k" | "1080p"

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
  if (resolution === "4k" || resolution === "1080p") return true
  if (typeof shortEdge === "number" && shortEdge >= VIDEO_QUALITY_POLICY.minShortEdge) return true
  return false
}

export function isFastTtsModel(model: string) {
  return /turbo|flash|low_lat|tts-1($|-hd)?/i.test(model)
}
