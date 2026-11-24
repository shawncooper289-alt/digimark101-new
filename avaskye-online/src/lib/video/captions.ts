import { VIDEO_QUALITY_POLICY } from "./quality"
import type { Scene } from "./types"

function stamp(ms: number) {
  const clamped = Math.max(0, Math.round(ms))
  const hours = Math.floor(clamped / 3_600_000)
  const minutes = Math.floor((clamped % 3_600_000) / 60_000)
  const seconds = Math.floor((clamped % 60_000) / 1000)
  const millis = clamped % 1000
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`
}

function srtStamp(ms: number) {
  return stamp(ms).replace(".", ",")
}

export function captionsVtt(scenes: Scene[]) {
  const cues = scenes.map((scene) => `${stamp(scene.startMs)} --> ${stamp(scene.endMs)}\n${scene.caption}`)
  return `WEBVTT\n\n${cues.join("\n\n")}\n`
}

export function captionsSrt(scenes: Scene[]) {
  const cues = scenes.map((scene, index) => `${index + 1}\n${srtStamp(scene.startMs)} --> ${srtStamp(scene.endMs)}\n${scene.caption}`)
  return `${cues.join("\n\n")}\n`
}

export function captionsAligned(scenes: Scene[]) {
  if (!scenes.length) return { ok: false, detail: "There are no captions yet." }
  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index]
    if (!scene.caption.trim() || !scene.spoken.trim()) {
      return { ok: false, detail: `Scene ${index + 1} is missing words on screen or in the voice-over.` }
    }
    if (scene.endMs <= scene.startMs) {
      return { ok: false, detail: `Scene ${index + 1} has no time on screen.` }
    }
    if (index > 0 && scene.startMs + VIDEO_QUALITY_POLICY.captionDriftMs < scenes[index - 1].endMs) {
      return { ok: false, detail: `Scene ${index + 1} starts before the previous caption has finished.` }
    }
  }
  return { ok: true, detail: "Captions follow each spoken line." }
}
