import { localChecks } from "./gate"
import { heygenBody, heygenCreateUrl, heygenStatusUrl } from "./heygen"
import { brollReady, capabilityReport, genericLipsync, heygenKey, lipsyncProvider, musicReady, type Env } from "./providers"
import { VIDEO_QUALITY_POLICY, type VideoResolution } from "./quality"
import type { TextTools } from "./text"
import type { VideoProject } from "./types"

export type FinalPlan =
  | { ok: false; reasons: string[] }
  | {
      ok: true
      provider: "heygen" | "generic" | "broll"
      resolution: VideoResolution
      project: VideoProject
      picture: string
    }

function containsBanned(tools: TextTools) {
  return (text: string) => tools.omitBannedLine(text) !== text
}

export function planFinal(project: VideoProject, env: Env, tools: TextTools, resolution: VideoResolution = "4k"): FinalPlan {
  const local = localChecks(project, { containsBanned: containsBanned(tools) })
  const reasons = local.filter((item) => item.state !== "pass" && item.state !== "not_applicable").map((item) => item.detail)
  const talking = project.scenes.some((scene) => scene.talking)
  const faceless = !talking
  if (faceless && !brollReady(env)) {
    reasons.push("Pro feature: animated or presenter-free footage unlocks when a video model key and URL are set. No preview was substituted.")
  }
  if (!faceless && project.brief.presenter === "ava" && !project.avatarId) {
    reasons.push("Ava's avatar id is not set. Her face stays on the Let's get started clip, and that id is required before a finished video starts.")
  }
  if (!faceless && project.brief.presenter === "stock" && !project.avatarId) {
    reasons.push("That ready-made presenter is not connected yet. No stand-in face was used.")
  }
  if (!project.voiceId) {
    reasons.push("A voice id is not set. The finished voice-over was not started.")
  }
  if (talking && lipsyncProvider(env) === "none") {
    reasons.push("Pro feature: lip-sync video unlocks when a video avatar key is set. No preview was substituted.")
  }
  if (reasons.length) return { ok: false, reasons }
  if (!faceless) {
    const built = heygenBody(project, resolution)
    if ("error" in built) return { ok: false, reasons: [built.error] }
    if (built.resolution !== "4k" && built.resolution !== "1080p") {
      return { ok: false, reasons: ["The render tried to leave the premium resolution list."] }
    }
    if (built.scenes.some((scene) => scene.input.engine.type !== VIDEO_QUALITY_POLICY.avatarEngine)) {
      return { ok: false, reasons: ["The render tried to use a lower avatar engine."] }
    }
    if (built.scenes.some((scene) => scene.input.voice_settings.engine_settings.model !== VIDEO_QUALITY_POLICY.ttsModel)) {
      return { ok: false, reasons: ["The render tried to use a lower voice model."] }
    }
  }
  const provider = faceless ? "broll" : lipsyncProvider(env)
  if (provider === "none") return { ok: false, reasons: ["No video provider is configured."] }
  const picture = faceless
    ? "Animated plates at the premium resolution."
    : brollReady(env) && project.brief.style === "cinematic"
      ? "Presenter with lip sync, plus a cinematic plate request."
      : "Presenter with lip sync and cinematic camera moves. No separate B-roll plate is claimed."
  return { ok: true, provider, resolution, project, picture }
}

export function premiumRequest(project: VideoProject, resolution: VideoResolution) {
  return heygenBody(project, resolution)
}

type RenderCall =
  | { ok: false; reasons: string[] }
  | {
      ok: true
      provider: "heygen" | "generic" | "broll"
      picture: string
      resolution: VideoResolution
      url: string
      headers: Record<string, string>
      body: unknown
    }

export function renderCall(project: VideoProject, env: Env, tools: TextTools, resolution: VideoResolution = "4k"): RenderCall {
  const plan = planFinal(project, env, tools, resolution)
  if (!plan.ok) return plan
  const premium = {
    quality: VIDEO_QUALITY_POLICY.id,
    resolution,
    fps: plan.provider === "heygen" ? VIDEO_QUALITY_POLICY.heygenAvatarFps : VIDEO_QUALITY_POLICY.preferredFps,
    aspectRatio: project.brief.aspect,
    ttsModel: VIDEO_QUALITY_POLICY.ttsModel,
    title: project.title,
    script: project.spokenScript,
    captions: project.captionsSrt,
    scenes: project.scenes.map((scene) => ({
      spoken: scene.spoken,
      caption: scene.caption,
      camera: scene.camera,
      transition: scene.transition,
      lighting: scene.lighting,
      visual: scene.visual,
      avatarId: scene.avatarId,
      voiceId: scene.voiceId,
      startMs: scene.startMs,
      endMs: scene.endMs,
    })),
  }
  if (plan.provider === "heygen") {
    const body = heygenBody(project, resolution)
    if ("error" in body) return { ok: false as const, reasons: [body.error] }
    return {
      ok: true as const,
      provider: plan.provider,
      picture: plan.picture,
      resolution,
      url: heygenCreateUrl(),
      headers: { "X-Api-Key": heygenKey(env), "Content-Type": "application/json" },
      body,
    }
  }
  if (plan.provider === "broll") {
    return {
      ok: true as const,
      provider: plan.provider,
      picture: plan.picture,
      resolution,
      url: env.VIDEO_BROLL_API_URL!.trim(),
      headers: { Authorization: `Bearer ${env.VIDEO_BROLL_API_KEY!.trim()}`, "Content-Type": "application/json" },
      body: premium,
    }
  }
  const generic = genericLipsync(env)
  if (!generic) return { ok: false as const, reasons: ["The generic video provider is missing a key or a URL."] }
  return {
    ok: true as const,
    provider: plan.provider,
    picture: plan.picture,
    resolution,
    url: generic.url,
    headers: { Authorization: `Bearer ${generic.key}`, "Content-Type": "application/json" },
    body: premium,
  }
}

export function statusCall(env: Env, provider: string, videoId: string): { url: string; headers: Record<string, string> } | null {
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(videoId)) return null
  if (provider === "heygen") {
    const key = heygenKey(env)
    if (!key) return null
    return { url: heygenStatusUrl(videoId), headers: { "X-Api-Key": key } }
  }
  const template = provider === "broll" ? env.VIDEO_BROLL_STATUS_URL : env.VIDEO_LIPSYNC_STATUS_URL
  const key = provider === "broll" ? env.VIDEO_BROLL_API_KEY : env.VIDEO_LIPSYNC_API_KEY
  if (!template?.trim() || !key?.trim() || !template.includes("{id}")) return null
  return {
    url: template.trim().replace("{id}", encodeURIComponent(videoId)),
    headers: { Authorization: `Bearer ${key.trim()}` },
  }
}

export function musicRequest(env: Env, title: string) {
  if (!musicReady(env)) return null
  return {
    url: env.VIDEO_MUSIC_API_URL!.trim(),
    key: env.VIDEO_MUSIC_API_KEY!.trim(),
    body: {
      title,
      brief: "Instrumental bed. Warm, sparse, no lyrics, no vocal that could clash with the voice-over.",
      quality: VIDEO_QUALITY_POLICY.id,
    },
  }
}

export function publicStatus(env: Env) {
  return capabilityReport(env)
}
