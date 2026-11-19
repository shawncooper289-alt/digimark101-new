import { makeId } from "./ids"
import type { CostEstimate } from "./cost"
import type { FilmTimeline } from "./assemble"
import type { PlannedShot } from "./shots"
import type { DeliveryDecision, VideoBrief, VideoProject } from "./types"

export type JobStage =
  | "script"
  | "voice"
  | "avatar"
  | "broll"
  | "lipsync"
  | "music"
  | "assemble"
  | "quality"
  | "review"
  | "published"
  | "blocked"

export type WordMark = { word: string; startMs: number; endMs: number }

export type StoredAsset = { kind: string; path: string; url: string }

export type VideoJob = {
  id: string
  app: "studio" | "office"
  ownerId: string
  stage: JobStage
  title: string
  brief: VideoBrief | null
  project: VideoProject | null
  shots: PlannedShot[]
  words: WordMark[]
  voiceUrl: string
  musicUrl: string
  masterUrl: string
  composition: FilmTimeline | null
  picture: { width: number; height: number; fps: number; videoDurationMs: number; audioDurationMs: number } | null
  quality: DeliveryDecision | null
  cost: CostEstimate | null
  note: string
  reasons: string[]
  attempt: number
  approvedAt: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  assets: StoredAsset[]
  lockedBy: string
  lockedUntil: string
}

export type VideoStore = {
  save(job: VideoJob): Promise<void>
  load(id: string): Promise<VideoJob | null>
  list(limit?: number): Promise<VideoJob[]>
  waiting(): Promise<VideoJob[]>
  putAsset(input: { jobId: string; name: string; bytes: Uint8Array; contentType: string }): Promise<{ path: string; url: string }>
  /** Take the job only if nobody else is already cutting it. */
  claim(id: string, holder: string, ttlMs: number): Promise<VideoJob | null>
  release(id: string, holder: string): Promise<void>
}

const WAITING: JobStage[] = ["script", "voice", "avatar", "broll", "lipsync", "music", "assemble", "quality"]

export function createVideoJob(input: { app: "studio" | "office"; ownerId?: string; brief: VideoBrief }): VideoJob {
  const now = new Date().toISOString()
  return {
    id: makeId("job"),
    app: input.app,
    ownerId: input.ownerId || "",
    stage: "script",
    title: input.brief.title || "Ava video",
    brief: input.brief,
    project: null,
    shots: [],
    words: [],
    voiceUrl: "",
    musicUrl: "",
    masterUrl: "",
    composition: null,
    picture: null,
    quality: null,
    cost: null,
    note: "",
    reasons: [],
    attempt: 1,
    approvedAt: "",
    publishedAt: "",
    createdAt: now,
    updatedAt: now,
    assets: [],
    lockedBy: "",
    lockedUntil: "",
  }
}

/** Swap stored file addresses for freshly signed ones. Provider links that we do not own stay as they are. */
export function applyFreshUrls(job: VideoJob, fresh: { path: string; url: string }[]): VideoJob {
  const byPath = new Map(fresh.map((item) => [item.path, item.url]))
  const byOld = new Map(job.assets.map((asset) => [asset.url, byPath.get(asset.path) || asset.url]))
  const swap = (url: string) => (url && byOld.get(url)) || url
  return {
    ...job,
    masterUrl: swap(job.masterUrl),
    musicUrl: swap(job.musicUrl),
    voiceUrl: swap(job.voiceUrl),
    assets: job.assets.map((asset) => ({ ...asset, url: byPath.get(asset.path) || asset.url })),
    shots: job.shots.map((shot) => ({
      ...shot,
      audioUrl: swap(shot.audioUrl),
      outputUrl: swap(shot.outputUrl),
    })),
  }
}

export function touch(job: VideoJob, patch: Partial<VideoJob>): VideoJob {
  return { ...job, ...patch, updatedAt: new Date().toISOString() }
}

export function memoryVideoStore(): VideoStore {
  const jobs = new Map<string, VideoJob>()
  return {
    async save(job) {
      jobs.set(job.id, JSON.parse(JSON.stringify(job)) as VideoJob)
    },
    async load(id) {
      const found = jobs.get(id)
      return found ? JSON.parse(JSON.stringify(found)) as VideoJob : null
    },
    async list(limit = 20) {
      return [...jobs.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit).map((job) => JSON.parse(JSON.stringify(job)) as VideoJob)
    },
    async waiting() {
      return [...jobs.values()].filter((job) => WAITING.includes(job.stage)).map((job) => JSON.parse(JSON.stringify(job)) as VideoJob)
    },
    async putAsset(input) {
      const path = `jobs/${input.jobId}/${input.name}`
      return { path, url: `https://videos.example/${path}` }
    },
    async claim(id, holder, ttlMs) {
      const found = jobs.get(id)
      if (!found) return null
      const until = Date.parse(found.lockedUntil || "")
      if (found.lockedBy && found.lockedBy !== holder && Number.isFinite(until) && until > Date.now()) return null
      const next = { ...found, lockedBy: holder, lockedUntil: new Date(Date.now() + ttlMs).toISOString() }
      jobs.set(id, JSON.parse(JSON.stringify(next)) as VideoJob)
      return JSON.parse(JSON.stringify(next)) as VideoJob
    },
    async release(id, holder) {
      const found = jobs.get(id)
      if (!found || found.lockedBy !== holder) return
      const next = { ...found, lockedBy: "", lockedUntil: "" }
      jobs.set(id, JSON.parse(JSON.stringify(next)) as VideoJob)
    },
  }
}

export function stageLabel(stage: string) {
  switch (stage) {
    case "script": return "Writing the script"
    case "voice": return "Recording Ava's voice"
    case "avatar": return "Filming Ava"
    case "broll": return "Filming the extra shots"
    case "lipsync": return "Matching the mouth on a cutaway"
    case "music": return "Adding music"
    case "assemble": return "Cutting the film"
    case "quality": return "Checking the picture"
    case "review": return "Ready for your approval"
    case "published": return "Approved"
    case "blocked": return "Stopped"
    default: return "Working"
  }
}

export function isWaitingStage(stage: JobStage) {
  return WAITING.includes(stage)
}
