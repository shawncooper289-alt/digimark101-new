import { falModelRate } from "./fal"
import { grokRatePerSecond, grokVideoRequest, type GrokModel } from "./grok"
import { VIDEO_QUALITY_POLICY } from "./quality"
import type { Env } from "./providers"
import type { PlannedShot } from "./shots"

function talkingChoice(env: Env) {
  return env.VIDEO_TALKING_PROVIDER?.trim() === "grok" ? "grok" : "heygen"
}

function brollChoice(env: Env) {
  if (env.VIDEO_BROLL_PROVIDER?.trim() === "fal") return "fal"
  return "grok"
}

function grokChoice(env: Env): GrokModel {
  return env.VIDEO_GROK_MODEL?.trim() === "grok-imagine-video-1.5-lite" ? "grok-imagine-video-1.5-lite" : "grok-imagine-video-1.5"
}

function heygenChoice(env: Env) {
  return env.VIDEO_HEYGEN_ENGINE?.trim() === "heygen-avatar-6" ? "heygen-avatar-6" : "heygen-avatar-6-turbo"
}

export type CostLine = { label: string; usd: number }
export type CostEstimate = {
  usd: number
  lines: CostLine[]
  withinTarget: boolean
  capUsd: number
  note: string
}

function money(value: number) {
  return Math.round(value * 100) / 100
}

function seconds(shot: PlannedShot) {
  return Math.max(1, (shot.endMs - shot.startMs) / 1000)
}

export function estimateShots(shots: PlannedShot[], env: Env, script: string, musicSeconds = 0): CostEstimate {
  const cap = Number(env.VIDEO_COST_CAP_USD) || VIDEO_QUALITY_POLICY.costCapUsd
  const lines: CostLine[] = []
  let heygen = 0
  let grok = 0
  let fal = 0
  let lipsync = 0
  const talking = talkingChoice(env)
  const broll = brollChoice(env)
  const model = grokChoice(env)
  for (const shot of shots) {
    const sec = seconds(shot)
    if (shot.role === "talking") {
      if (talking === "heygen") heygen += sec * (heygenChoice(env) === "heygen-avatar-6" ? 0.1 : 0.05)
      if (talking === "grok") {
        const request = grokVideoRequest({ model, prompt: shot.visual, durationMs: shot.endMs - shot.startMs, aspect: "16:9", referenceUrls: ["https://example.com/ava.jpg"], withAudio: true })
        grok += sec * grokRatePerSecond(model, request.resolution)
      }
    } else if (broll === "grok") {
      const refs = shot.role === "broll-ava" ? ["https://example.com/ava.jpg"] : []
      const request = grokVideoRequest({ model, prompt: shot.visual, durationMs: shot.endMs - shot.startMs, aspect: "16:9", referenceUrls: refs, withAudio: false })
      grok += sec * grokRatePerSecond(model, request.resolution)
    } else if (broll === "fal") {
      fal += sec * falModelRate(env.VIDEO_FAL_MODEL?.trim() || "fal-ai/kling-video/v2.5-turbo/pro/text-to-video")
    }
    if (shot.role === "broll-ava" && env.VIDEO_LIPSYNC_PASS?.trim() === "on" && env.SYNC_API_KEY?.trim()) lipsync += sec * 0.05
  }
  if (heygen) lines.push({ label: "Ava on camera (HeyGen)", usd: money(heygen) })
  if (grok) lines.push({ label: "Grok Imagine clips", usd: money(grok) })
  if (fal) lines.push({ label: "fal.ai B-roll", usd: money(fal) })
  const voice = (script.length / 1000) * 0.08
  if (voice && talking !== "grok") lines.push({ label: "ElevenLabs voice", usd: money(voice) })
  const musicOn = Boolean(env.FAL_KEY?.trim() || env.VIDEO_MUSIC_API_KEY?.trim())
  const music = musicOn ? Math.max(musicSeconds, shots.length ? (shots[shots.length - 1]?.endMs || 0) / 1000 : 0) * 0.0002 : 0
  if (music) lines.push({ label: "Music", usd: money(music) })
  if (lipsync) lines.push({ label: "Optional lip-sync pass", usd: money(lipsync) })
  const usd = money(lines.reduce((sum, line) => sum + line.usd, 0))
  const withinTarget = usd <= cap + 0.001
  return {
    usd,
    lines,
    withinTarget,
    capUsd: cap,
    note: withinTarget
      ? `About $${usd.toFixed(2)} for this cut. The aim for a 3.5 minute film is $${VIDEO_QUALITY_POLICY.costFloorUsd} to $${cap}.`
      : `About $${usd.toFixed(2)}, which is over the $${cap} cap. Shorten the film or raise VIDEO_COST_CAP_USD. Nothing was sent to a paid service.`,
  }
}

/** Published planning numbers for a 3.5 minute cinematic cut on the default stack. */
export function standardCutEstimate(env: Env = {}): CostEstimate {
  const total = 210000
  const talking = 147000
  const ava = 12600
  const plate = total - talking - ava
  const shots: PlannedShot[] = [
    { id: "t", index: 0, role: "talking", spoken: "", caption: "", visual: "studio", camera: "", transition: "", startMs: 0, endMs: talking, audioUrl: "", provider: "", providerId: "", pollUrl: "", status: "pending", outputUrl: "", error: "" },
    { id: "p", index: 1, role: "broll", spoken: "", caption: "", visual: "city", camera: "", transition: "", startMs: talking, endMs: talking + plate, audioUrl: "", provider: "", providerId: "", pollUrl: "", status: "pending", outputUrl: "", error: "" },
    { id: "a", index: 2, role: "broll-ava", spoken: "", caption: "", visual: "ava", camera: "", transition: "", startMs: talking + plate, endMs: total, audioUrl: "", provider: "", providerId: "", pollUrl: "", status: "pending", outputUrl: "", error: "" },
  ]
  const script = "x".repeat(3500)
  const merged: Env = { ...env, FAL_KEY: env.FAL_KEY || "set" }
  return estimateShots(shots, merged, script, 210)
}

export function costTable() {
  const grok = standardCutEstimate({ XAI_API_KEY: "set", VIDEO_BROLL_PROVIDER: "grok", VIDEO_TALKING_PROVIDER: "heygen" })
  const grokTalking = standardCutEstimate({ XAI_API_KEY: "set", VIDEO_TALKING_PROVIDER: "grok", VIDEO_BROLL_PROVIDER: "grok" })
  const fal = standardCutEstimate({ FAL_KEY: "set", VIDEO_BROLL_PROVIDER: "fal", XAI_API_KEY: "" })
  const lite = standardCutEstimate({ XAI_API_KEY: "set", VIDEO_GROK_MODEL: "grok-imagine-video-1.5-lite", VIDEO_BROLL_PROVIDER: "grok" })
  const pro = standardCutEstimate({ XAI_API_KEY: "set", VIDEO_HEYGEN_ENGINE: "heygen-avatar-6" })
  return [
    { id: "default", label: "HeyGen Avatar 6 Turbo on camera, Grok Imagine 1.5 for B-roll, ElevenLabs voice, ACE-Step music", ...grok },
    { id: "heygen-pro", label: "Same cut with HeyGen Avatar 6 Pro instead of Turbo", ...pro },
    { id: "grok-talking", label: "Grok Imagine 1.5 also films Ava on camera (preset voice, not her clone)", ...grokTalking },
    { id: "lite", label: "Grok Imagine 1.5 Lite for B-roll (no reference photos)", ...lite },
    { id: "fal", label: "Kling 2.5 Turbo on fal.ai instead of Grok", ...fal },
  ]
}
