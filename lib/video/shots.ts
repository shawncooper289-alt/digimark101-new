import { makeId } from "./ids"
import type { Scene, VideoProject } from "./types"

export type ShotRole = "talking" | "broll" | "broll-ava"

export type PlannedShot = {
  id: string
  index: number
  role: ShotRole
  spoken: string
  caption: string
  visual: string
  camera: string
  transition: string
  startMs: number
  endMs: number
  audioUrl: string
  provider: string
  providerId: string
  pollUrl: string
  status: "pending" | "submitted" | "ready" | "skipped" | "failed"
  outputUrl: string
  error: string
}

function blankShot(partial: Omit<PlannedShot, "audioUrl" | "provider" | "providerId" | "pollUrl" | "status" | "outputUrl" | "error">): PlannedShot {
  return {
    ...partial,
    audioUrl: "",
    provider: "",
    providerId: "",
    pollUrl: "",
    status: "pending",
    outputUrl: "",
    error: "",
  }
}

function splitScene(scene: Scene): Scene[] {
  const duration = Math.max(1, scene.endMs - scene.startMs)
  if (duration <= 14000) return [scene]
  const words = scene.spoken.split(/\s+/).filter(Boolean)
  const parts = Math.max(2, Math.ceil(duration / 8000))
  const size = Math.max(1, Math.ceil(words.length / parts))
  const slices: Scene[] = []
  for (let index = 0; index < words.length; index += size) {
    const spoken = words.slice(index, index + size).join(" ")
    const share = spoken.split(/\s+/).length / Math.max(1, words.length)
    slices.push({ ...scene, spoken, caption: spoken, startMs: 0, endMs: Math.max(2000, Math.round(duration * share)) })
  }
  return slices.length ? slices : [scene]
}

function group(scenes: Scene[], targetMs: number) {
  const groups: Scene[][] = []
  let bucket: Scene[] = []
  let acc = 0
  for (const scene of scenes.flatMap(splitScene)) {
    const dur = Math.max(1000, scene.endMs - scene.startMs)
    if (bucket.length && acc >= targetMs) {
      groups.push(bucket)
      bucket = []
      acc = 0
    }
    bucket.push(scene)
    acc += dur
  }
  if (bucket.length) groups.push(bucket)
  return groups
}

function roleFor(style: VideoProject["brief"]["style"], presenter: VideoProject["brief"]["presenter"], index: number, allowBroll: boolean, allowAva: boolean): ShotRole {
  if (presenter === "none" || style === "motion") return "broll"
  if (!allowBroll) return "talking"
  if (style === "presenter") return index % 4 === 3 ? "broll" : "talking"
  const cycle: ShotRole[] = ["talking", "talking", "broll", "talking", "talking", allowAva ? "broll-ava" : "broll", "talking"]
  return cycle[index % cycle.length]
}

export function planShots(project: VideoProject, options: { allowBroll: boolean; allowAvaCutaway: boolean }): PlannedShot[] {
  const groups = group(project.scenes, 8000)
  let cursor = 0
  const planned = groups.map((scenes, index) => {
    const spoken = scenes.map((scene) => scene.spoken).join(" ")
    const caption = scenes.map((scene) => scene.caption).join(" ")
    const duration = scenes.reduce((sum, scene) => sum + Math.max(1000, scene.endMs - scene.startMs), 0)
    const startMs = cursor
    const endMs = cursor + duration
    cursor = endMs
    const role = roleFor(project.brief.style, project.brief.presenter, index, options.allowBroll, options.allowAvaCutaway)
    const lead = scenes[0]
    return blankShot({
      id: makeId("shot"),
      index,
      role,
      spoken,
      caption,
      visual: lead?.visual || "",
      camera: lead?.camera || "",
      transition: lead?.transition || "Dissolve from the previous shot over a short beat.",
      startMs,
      endMs,
    })
  })
  return ensureCutaway(planned, project.brief.style, options.allowBroll)
}

function ensureCutaway(shots: PlannedShot[], style: VideoProject["brief"]["style"], allowBroll: boolean): PlannedShot[] {
  if (!allowBroll || (style !== "cinematic" && style !== "promo")) return shots
  if (shots.some((shot) => shot.role !== "talking")) return shots
  if (shots.length >= 2) {
    return shots.map((shot, index) => (index === shots.length - 1 ? { ...shot, role: "broll" as const } : shot))
  }
  const only = shots[0]
  if (!only) return shots
  const words = only.spoken.split(/\s+/).filter(Boolean)
  if (words.length < 8) return shots
  const mid = Math.ceil(words.length / 2)
  const midMs = only.startMs + Math.round((only.endMs - only.startMs) / 2)
  const second = words.slice(mid).join(" ")
  return [
    { ...only, spoken: words.slice(0, mid).join(" "), caption: words.slice(0, mid).join(" "), endMs: midMs, role: "talking" },
    { ...only, id: makeId("shot"), index: 1, role: "broll", spoken: second, caption: second, startMs: midMs },
  ]
}
