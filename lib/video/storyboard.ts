import { VIDEO_QUALITY_POLICY } from "./quality"
import { cameraMove, LIGHTING, transitionFor } from "./providers"
import type { Scene, VideoBrief } from "./types"
import { sentences, wordCount } from "./text"

const WORDS_PER_SECOND = 2.35

function sceneMs(line: string) {
  const spoken = Math.max(VIDEO_QUALITY_POLICY.minSceneSeconds, wordCount(line) / WORDS_PER_SECOND)
  return Math.round(spoken * 1000)
}

export function buildScenes(script: string, spokenScript: string, brief: VideoBrief, avatarId: string, voiceId: string): Scene[] {
  const display = sentences(script).slice(0, VIDEO_QUALITY_POLICY.maxScenes)
  const spoken = sentences(spokenScript)
  const lines = display.length ? display : []
  let cursor = 0
  return lines.map((caption, index) => {
    const spokenLine = spoken[index] || caption
    const duration = sceneMs(spokenLine)
    const startMs = cursor
    const endMs = cursor + duration
    cursor = endMs
    const talking = brief.presenter !== "none" && brief.style !== "motion"
    const directed = brief.scenePlan?.[index]
    return {
      index,
      spoken: spokenLine,
      caption,
      visual: directed?.visual || visualFor(brief, index),
      camera: directed?.camera || cameraMove(index),
      transition: directed ? directedTransition(directed.transition, index) : transitionFor(index),
      lighting: LIGHTING,
      avatarId: talking ? avatarId : "",
      voiceId,
      attire: brief.presenter === "ava" ? brief.attire : "",
      startMs,
      endMs,
      talking,
    }
  })
}

function directedTransition(transition: string, index: number) {
  const line = transition.trim()
  if (!line) return transitionFor(index)
  if (index > 0 && !line.toLowerCase().includes("dissolve")) {
    return `${line} Dissolve from the previous shot over a short beat.`
  }
  return line
}

function visualFor(brief: VideoBrief, index: number) {
  if (brief.style === "motion") {
    return index === 0
      ? "Animated type and a simple shape move in. Brand colors only. No stock crowd and no fake chart."
      : "The same motion system continues. One idea on screen. The move matches the line."
  }
  if (brief.style === "cinematic") {
    return "Presenter in the same light, with room for a cinematic plate beside the line. No new face."
  }
  if (brief.style === "promo") {
    return "Product or offer card with the logo and the brand colors. The presenter, if any, stays the same person."
  }
  return "The same presenter, framed for the chosen shape. Wardrobe stays the selected business outfit."
}

export function lengthNote(spokenSeconds: number, requestedSeconds: number) {
  if (spokenSeconds + 1 >= requestedSeconds) {
    return "The cut follows the script from start to finish."
  }
  return "This cut is as long as the words. It does not hold a frozen frame to fill the clock."
}
