import type { AspectRatio } from "./types"
import type { PlannedShot } from "./shots"

export type TimelineClip = {
  src: string
  startMs: number
  endMs: number
  fadeMs: number
  role: PlannedShot["role"]
  /** separate: play the voice file. clip: the picture file already contains the voice. */
  sound: "separate" | "clip"
}

export type TimelineCaption = { text: string; startMs: number; endMs: number }

export type FilmTimeline = {
  compositionId: "AvaFilm"
  fps: 30
  width: number
  height: number
  durationMs: number
  video: TimelineClip[]
  voice: { src: string; startMs: number; endMs: number; gain: number }[]
  music: { src: string; gain: number } | null
  captions: TimelineCaption[]
}

export function frameSize(aspect: AspectRatio) {
  if (aspect === "9:16") return { width: 1080, height: 1920 }
  if (aspect === "1:1") return { width: 1080, height: 1080 }
  return { width: 1920, height: 1080 }
}

function captionCues(shot: PlannedShot): TimelineCaption[] {
  const words = shot.caption.split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const cues: TimelineCaption[] = []
  const span = Math.max(1, shot.endMs - shot.startMs)
  const group = 6
  for (let index = 0; index < words.length; index += group) {
    const slice = words.slice(index, index + group)
    const start = shot.startMs + Math.round((index / words.length) * span)
    const end = shot.startMs + Math.round((Math.min(words.length, index + group) / words.length) * span)
    cues.push({ text: slice.join(" "), startMs: start, endMs: Math.max(start + 200, end) })
  }
  return cues
}

/** Remotion composition props. Music stays quiet under the voice. Clips dissolve. */
export function buildTimeline(input: {
  aspect: AspectRatio
  shots: PlannedShot[]
  musicUrl: string
}): FilmTimeline {
  const size = frameSize(input.aspect)
  const shots = input.shots.filter((shot) => shot.outputUrl || shot.audioUrl)
  const durationMs = input.shots.length ? input.shots[input.shots.length - 1].endMs : 0
  return {
    compositionId: "AvaFilm",
    fps: 30,
    ...size,
    durationMs,
    video: input.shots.filter((shot) => shot.outputUrl).map((shot, index) => ({
      src: shot.outputUrl,
      startMs: shot.startMs,
      endMs: shot.endMs,
      fadeMs: index === 0 ? 0 : 400,
      role: shot.role,
      sound: shot.audioUrl ? "separate" : "clip",
    })),
    voice: shots.filter((shot) => shot.audioUrl).map((shot) => ({
      src: shot.audioUrl,
      startMs: shot.startMs,
      endMs: shot.endMs,
      gain: 1,
    })),
    music: input.musicUrl ? { src: input.musicUrl, gain: 0.18 } : null,
    captions: input.shots.flatMap(captionCues),
  }
}
