import { VIDEO_QUALITY_POLICY } from "./quality"
import type { VideoBrief } from "./types"
import { clamp, cleanLine, sentences, wordCount, type TextTools } from "./text"

const WORDS_PER_SECOND = 2.35

function sentence(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return ""
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

export function writeScript(brief: VideoBrief, tools: TextTools) {
  const idea = cleanLine(brief.idea, tools.omitBannedLine)
  const audience = cleanLine(brief.audience, tools.omitBannedLine)
  const offer = cleanLine(brief.offer, tools.omitBannedLine)
  const cta = cleanLine(brief.cta, tools.omitBannedLine)
  const proof = cleanLine(brief.proof, tools.omitBannedLine)
  const override = cleanLine(brief.scriptOverride, tools.omitBannedLine)
  const title = cleanLine(brief.title, tools.omitBannedLine) || sentence(sentences(idea)[0] || "A new video").replace(/\.$/, "")

  if (override) {
    const full = tools.omitBannedLine(override)
    return {
      title,
      full,
      spokenSeconds: Math.max(VIDEO_QUALITY_POLICY.minSceneSeconds, wordCount(full) / WORDS_PER_SECOND),
    }
  }

  if (!idea) {
    return { title, full: "", spokenSeconds: 0 }
  }

  const ideaLines = sentences(idea)
  const lines = [
    sentence(ideaLines[0] || idea),
    audience ? `This is for ${audience.replace(/\.$/, "")}.` : "",
    ...ideaLines.slice(1).map(sentence),
    proof ? sentence(proof) : "",
    offer ? `The offer is ${offer.replace(/\.$/, "")}.` : "",
    cta ? sentence(cta) : "Take the next step when you are ready.",
  ].filter(Boolean)

  const full = tools.omitBannedLine(lines.join(" "))
  const spokenSeconds = Math.max(VIDEO_QUALITY_POLICY.minSceneSeconds, wordCount(full) / WORDS_PER_SECOND)
  return { title, full, spokenSeconds }
}

export function nextCuts(title: string, idea: string) {
  const topic = title || "this idea"
  const hook = sentences(idea)[0] || topic
  return [
    { title: `${topic}: the next step`, hook: `Pick up where this left off. ${hook}` },
    { title: `${topic}: a common miss`, hook: "Name one thing people skip, then show the fix in one line." },
    { title: `${topic}: what to do this week`, hook: "One action, one owner, and a day to do it." },
  ].map((item) => ({
    title: item.title.slice(0, 80),
    hook: item.hook.slice(0, 180),
  }))
}

export function requestedSeconds(value: number) {
  return clamp(Number.isFinite(value) ? value : 45, 12, VIDEO_QUALITY_POLICY.maxDurationSeconds)
}
