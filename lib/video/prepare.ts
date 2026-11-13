import { captionsSrt, captionsVtt } from "./captions"
import { nextCuts, requestedSeconds, writeScript } from "./script"
import { buildScenes, lengthNote } from "./storyboard"
import { stripQualityOverrides } from "./quality"
import { ASPECTS, ATTIRE, STYLES, type SceneDirection, type VideoBrief, type VideoProject } from "./types"
import { safeHttpsUrl, type TextTools } from "./text"
import {
  avaAvatarId,
  defaultBrand,
  LIGHTING,
  stockAvatarId,
  stockVoices,
  videoVoiceId,
  voiceLabel,
  type Env,
} from "./providers"

function readScenePlan(value: unknown): SceneDirection[] {
  if (!Array.isArray(value)) return []
  const plan: SceneDirection[] = []
  for (const item of value) {
    if (plan.length >= 50) break
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const visual = textOf(row.visual, 600)
    const camera = textOf(row.camera, 400)
    const transition = textOf(row.transition, 400)
    if (!visual && !camera && !transition) continue
    plan.push({ visual, camera, transition })
  }
  return plan
}

function textOf(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function numberOf(value: unknown) {
  return typeof value === "number" ? value : Number(value)
}

export function readBrief(input: unknown): { brief: VideoBrief; ignored: string[] } | { error: string } {
  if (!input || typeof input !== "object") return { error: "The brief was empty." }
  const { brief: raw, ignored } = stripQualityOverrides(input as Record<string, unknown>)
  const aspect = textOf(raw.aspect, 8)
  const style = textOf(raw.style, 20)
  const presenter = textOf(raw.presenter, 12)
  const attire = textOf(raw.attire, 32)
  const brandRaw = raw.brand && typeof raw.brand === "object" ? raw.brand as Record<string, unknown> : {}
  if (!(ASPECTS as readonly string[]).includes(aspect)) return { error: "Pick a shape: 9:16, 1:1, or 16:9." }
  if (!(STYLES as readonly string[]).includes(style)) return { error: "Pick a style: presenter, cinematic, motion, or promo." }
  if (presenter !== "ava" && presenter !== "stock" && presenter !== "none") return { error: "Pick Ava, a ready-made presenter, or no presenter." }
  if (attire && !(ATTIRE as readonly string[]).includes(attire)) return { error: "That outfit is not one of the business looks." }
  const brief: VideoBrief = {
    title: textOf(raw.title, 80),
    idea: textOf(raw.idea, 4000),
    audience: textOf(raw.audience, 160),
    offer: textOf(raw.offer, 240),
    cta: textOf(raw.cta, 160),
    proof: textOf(raw.proof, 400),
    seconds: requestedSeconds(numberOf(raw.seconds)),
    aspect: aspect as VideoBrief["aspect"],
    style: style as VideoBrief["style"],
    presenter: presenter as VideoBrief["presenter"],
    stockLabel: textOf(raw.stockLabel, 80),
    voiceChoice: textOf(raw.voiceChoice, 80),
    attire: ((ATTIRE as readonly string[]).includes(attire) ? attire : "navy-blazer") as VideoBrief["attire"],
    brand: {
      ...defaultBrand(textOf(brandRaw.primary, 7), textOf(brandRaw.accent, 7), textOf(brandRaw.font, 40), textOf(brandRaw.logoUrl, 300)),
      logoUrl: safeHttpsUrl(textOf(brandRaw.logoUrl, 300)),
    },
    scriptOverride: textOf(raw.scriptOverride, 8000),
    scenePlan: readScenePlan(raw.scenePlan),
  }
  return { brief, ignored }
}

export function prepareProject(input: unknown, env: Env, tools: TextTools): { project: VideoProject } | { error: string } {
  const read = readBrief(input)
  if ("error" in read) return read
  const script = writeScript(read.brief, tools)
  if (!script.full) return { error: "Add the idea in a sentence or two." }
  const spokenScript = tools.spokenText(tools.omitBannedLine(script.full))
  const avatarId = read.brief.presenter === "ava"
    ? avaAvatarId(env, read.brief.attire)
    : read.brief.presenter === "stock"
      ? stockAvatarId(env, read.brief.stockLabel)
      : ""
  const stockVoice = read.brief.presenter === "ava" ? undefined : stockVoices(env).find((item) => item.label === read.brief.voiceChoice)
  const voiceId = read.brief.presenter !== "ava" && read.brief.voiceChoice ? stockVoice?.id || "" : videoVoiceId(env)
  const chosenVoiceLabel = read.brief.presenter !== "ava" && read.brief.voiceChoice ? (stockVoice?.label || "") : voiceLabel(env)
  const scenes = buildScenes(script.full, spokenScript, read.brief, avatarId, voiceId)
  if (!scenes.length) return { error: "The script did not produce any scenes." }
  const project: VideoProject = {
    title: script.title,
    brief: read.brief,
    script: tools.omitBannedLine(script.full),
    spokenScript,
    scenes,
    spokenSeconds: Math.round(script.spokenSeconds),
    requestedSeconds: read.brief.seconds,
    lengthNote: lengthNote(script.spokenSeconds, read.brief.seconds),
    lighting: LIGHTING,
    avatarId,
    voiceId,
    voiceLabel: read.brief.presenter !== "ava" && read.brief.voiceChoice
      ? (chosenVoiceLabel || "That voice is not connected")
      : voiceLabel(env),
    next: nextCuts(script.title, read.brief.idea),
    captionsVtt: captionsVtt(scenes),
    captionsSrt: captionsSrt(scenes),
    ignoredOverrides: read.ignored,
  }
  return { project }
}
