export const ASPECTS = ["9:16", "1:1", "16:9"] as const
export type AspectRatio = (typeof ASPECTS)[number]

export const STYLES = ["presenter", "cinematic", "motion", "promo"] as const
export type VideoStyle = (typeof STYLES)[number]

export const ATTIRE = ["navy-blazer", "black-suit", "tailored-jacket"] as const
export type AttireId = (typeof ATTIRE)[number]

export const NETWORKS = ["tiktok", "instagram", "youtube", "facebook"] as const
export type HandoffNetwork = (typeof NETWORKS)[number]

export type BrandKit = {
  primary: string
  accent: string
  font: string
  logoUrl: string
}

/** Optional per-sentence direction for a prepared storyboard. */
export type SceneDirection = {
  visual: string
  camera: string
  transition: string
}

export type VideoBrief = {
  title: string
  idea: string
  audience: string
  offer: string
  cta: string
  proof: string
  seconds: number
  aspect: AspectRatio
  style: VideoStyle
  presenter: "ava" | "stock" | "none"
  stockLabel: string
  voiceChoice: string
  attire: AttireId
  brand: BrandKit
  scriptOverride: string
  scenePlan: SceneDirection[]
}

export type Scene = {
  index: number
  spoken: string
  caption: string
  visual: string
  camera: string
  transition: string
  lighting: string
  avatarId: string
  voiceId: string
  attire: AttireId | ""
  startMs: number
  endMs: number
  talking: boolean
}

export type VideoProject = {
  title: string
  brief: VideoBrief
  script: string
  spokenScript: string
  scenes: Scene[]
  spokenSeconds: number
  requestedSeconds: number
  lengthNote: string
  lighting: string
  avatarId: string
  voiceId: string
  voiceLabel: string
  next: { title: string; hook: string }[]
  captionsVtt: string
  captionsSrt: string
  ignoredOverrides: string[]
}

export type CheckState = "pass" | "fail" | "not_measured" | "not_applicable"

export type QualityCheck = {
  id: string
  label: string
  state: CheckState
  detail: string
}

export type DeliveryDecision = {
  deliver: boolean
  retryable: boolean
  reasons: string[]
  checks: QualityCheck[]
}

export type MediaProbe = {
  status?: string
  resolution?: string
  resolutionNote?: string
  width?: number
  height?: number
  fps?: number
  videoDurationMs?: number
  audioDurationMs?: number
  lipSyncOffsetMs?: number | null
  blackFrameCount?: number
  frozenSeconds?: number
  videoUrl?: string
  subtitleUrl?: string
}
