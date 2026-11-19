import { buildTimeline, type FilmTimeline } from "./assemble"
import { decide, localChecks, probeChecks } from "./gate"
import { createVideoJob, stageLabel, touch, type VideoJob, type VideoStore } from "./job"
import { estimateShots } from "./cost"
import { prepareProject } from "./prepare"
import {
  brollProvider,
  falKey,
  heygenKey,
  lipsyncEnabled,
  referenceImageUrls,
  talkingProvider,
  videoVoiceId,
  xaiKey,
  type Env,
} from "./providers"
import { buildScenes } from "./storyboard"
import { planShots, type PlannedShot } from "./shots"
import { parseScriptPlan, scriptMessages } from "./script-llm"
import { openAiEnvModel } from "./script-call"
import type { TextTools } from "./text"
import type { MediaProbe, VideoBrief } from "./types"
import {
  pollVendor,
  resolveHeygenEngine,
  submitFalClip,
  submitGrok,
  submitHeygen,
  submitLipsync,
  submitMusic,
  synthesizeSpeech,
  vendorHeaders,
  type FetchLike,
  type VendorState,
} from "./vendors"

export type RenderResult = {
  url: string
  bytes?: Uint8Array
  width: number
  height: number
  fps: number
  videoDurationMs: number
  audioDurationMs: number
  blackFrameCount?: number
  frozenSeconds?: number
  lipSyncOffsetMs?: number
}

export type PipelineDeps = {
  env: Env
  tools: TextTools
  fetchImpl: FetchLike
  store: VideoStore
  app: "studio" | "office"
  ownerId?: string
  callbackBase?: string
  editorReady: () => Promise<{ ok: boolean; reason?: string }>
  render: (timeline: FilmTimeline) => Promise<RenderResult | { error: string }>
  probe?: (url: string) => Promise<Partial<MediaProbe>>
}

function blocked(job: VideoJob, reasons: string[], note = ""): VideoJob {
  return touch(job, { stage: "blocked", reasons, note: note || job.note, masterUrl: "" })
}

function applyVendor(shot: PlannedShot, result: VendorState, provider: string): PlannedShot {
  if (result.state === "failed") return { ...shot, provider, status: "failed", error: result.message }
  if (result.state === "ready") {
    return { ...shot, provider, providerId: result.id || shot.providerId, pollUrl: result.pollUrl || shot.pollUrl, status: "ready", outputUrl: result.url, error: "" }
  }
  return { ...shot, provider, providerId: result.id || shot.providerId, pollUrl: result.pollUrl || shot.pollUrl, status: "submitted", error: "" }
}

function callbackFor(deps: PipelineDeps, job: VideoJob, shot: PlannedShot) {
  const base = deps.callbackBase?.replace(/\/$/, "") || ""
  const secret = deps.env.VIDEO_WEBHOOK_SECRET?.trim() || ""
  if (!base.startsWith("https://") || !secret) return { url: "", id: `${job.id}:${shot.id}` }
  const path = deps.app === "office" ? "/api/office/video/webhook" : "/api/studio/video/webhook"
  return { url: `${base}${path}?token=${encodeURIComponent(secret)}`, id: `${job.id}:${shot.id}` }
}

async function writeScript(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  if (!job.brief) return blocked(job, ["The brief was empty."])
  const prepared = prepareProject(job.brief, deps.env, deps.tools)
  if ("error" in prepared) return blocked(job, [prepared.error])
  let project = prepared.project
  let note = "The script was prepared from the brief."
  const openAi = openAiEnvModel(deps.env)
  if (openAi) {
    const response = await deps.fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAi.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: openAi.model, temperature: 0.4, messages: scriptMessages(job.brief) }),
      signal: AbortSignal.timeout(25000),
    }).catch(() => null)
    const payload = await response?.json().catch(() => null) as { choices?: { message?: { content?: string } }[] } | null
    const text = payload?.choices?.[0]?.message?.content || ""
    const plan = text ? parseScriptPlan(text) : null
    if (response?.ok && plan) {
      const script = deps.tools.omitBannedLine(plan.script)
      const spoken = deps.tools.spokenText(script)
      const scenes = buildScenes(script, spoken, job.brief, project.avatarId, project.voiceId)
      if (scenes.length) {
        project = {
          ...project,
          title: deps.tools.omitBannedLine(plan.title) || project.title,
          script,
          spokenScript: spoken,
          scenes,
        }
        note = `The script was written with ${openAi.model}.`
      }
    } else {
      note = "The script writer did not answer, so the prepared script was used."
    }
  }
  const local = localChecks(project, { containsBanned: (text) => deps.tools.omitBannedLine(text) !== text })
  const problems = local.filter((item) => item.state === "fail").map((item) => item.detail)
  if (problems.length) return blocked({ ...job, project }, problems)
  const wantsBroll = project.brief.presenter === "none"
    || project.brief.style === "cinematic"
    || project.brief.style === "promo"
    || project.brief.style === "motion"
  const allowBroll = wantsBroll || brollProvider(deps.env) !== "none"
  const shots = planShots(project, { allowBroll, allowAvaCutaway: referenceImageUrls(deps.env).length > 0 && grokCanReference(deps.env) })
  if (!shots.length) return blocked(job, ["The script did not produce any shots."])
  const cost = estimateShots(shots, deps.env, project.spokenScript)
  const missing = missingPieces(deps.env, shots)
  if (missing.length) return blocked({ ...job, project, shots, cost }, missing)
  if (!cost.withinTarget) return blocked({ ...job, project, shots, cost }, [cost.note])
  const editor = await deps.editorReady()
  if (!editor.ok) return blocked({ ...job, project, shots, cost }, [editor.reason || "The film editor is not configured. Nothing was sent to a paid service."])
  return touch(job, { stage: "voice", project, shots, cost, title: project.title, note })
}

function grokCanReference(env: Env) {
  return (env.VIDEO_GROK_MODEL?.trim() || "grok-imagine-video-1.5") !== "grok-imagine-video-1.5-lite"
}

function missingPieces(env: Env, shots: PlannedShot[]) {
  const reasons: string[] = []
  const needsTalking = shots.some((shot) => shot.role === "talking")
  const needsBroll = shots.some((shot) => shot.role !== "talking")
  if (needsTalking && talkingProvider(env) === "none") {
    reasons.push(env.VIDEO_TALKING_PROVIDER?.trim() === "grok"
      ? "Grok is selected for Ava's on-camera shots, but XAI_API_KEY is not set. Nothing was rendered."
      : "Ava's on-camera camera is not connected. Add HEYGEN_API_KEY and AVA_AVATAR_ID. Nothing was rendered.")
  }
  if (needsTalking && talkingProvider(env) === "heygen" && (!videoVoiceId(env) || !env.ELEVENLABS_API_KEY?.trim())) {
    reasons.push("Ava's voice is not connected. Add ELEVENLABS_API_KEY and AVA_VOICE_CLONE_ID. Nothing was rendered.")
  }
  if (needsTalking && talkingProvider(env) === "grok" && referenceImageUrls(env).length === 0) {
    reasons.push("Grok talking shots need Ava reference photos in AVA_REFERENCE_IMAGE_URLS. Nothing was rendered.")
  }
  if (needsBroll && brollProvider(env) === "none") {
    reasons.push("Cinematic B-roll is not connected. Add XAI_API_KEY, or set VIDEO_BROLL_PROVIDER=fal and FAL_KEY. Nothing was rendered.")
  }
  return reasons
}

async function recordVoice(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  const shots = job.shots.map((shot) => ({ ...shot }))
  const words = [...job.words]
  let changed = false
  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index]
    if (shot.audioUrl) continue
    if (talkingProvider(deps.env) === "grok" && shot.role === "talking") continue
    const spoken = job.project ? deps.tools.spokenText(shot.spoken) : shot.spoken
    const result = await synthesizeSpeech({
      env: deps.env,
      fetchImpl: deps.fetchImpl,
      text: spoken,
      previousText: shots[index - 1]?.spoken || "",
      nextText: shots[index + 1]?.spoken || "",
      store: deps.store,
      jobId: job.id,
      name: `${shot.id}.mp3`,
      offsetMs: shot.startMs,
    })
    if (!result.ok) return blocked(job, [result.message])
    shot.audioUrl = result.url
    words.push(...result.words)
    job.assets = [...job.assets, { kind: "voice", path: result.path, url: result.url }]
    changed = true
  }
  if (!changed && shots.every((shot) => shot.audioUrl || (shot.role === "talking" && talkingProvider(deps.env) === "grok"))) {
    return touch(job, { stage: "avatar", shots, words })
  }
  return touch(job, { stage: "avatar", shots, words, voiceUrl: shots.find((shot) => shot.audioUrl)?.audioUrl || job.voiceUrl })
}

async function filmAvatar(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  const provider = talkingProvider(deps.env)
  const shots = job.shots.map((shot) => ({ ...shot }))
  let note = job.note
  if (provider === "heygen") {
    const look = await resolveHeygenEngine(deps.env, deps.fetchImpl, job.project?.avatarId || "")
    if (!look.engine) return blocked(job, [look.note])
    if (look.note) note = [note, look.note].filter(Boolean).join(" ")
    for (const shot of shots) {
      if (shot.role !== "talking" || shot.status === "ready") continue
      if (shot.status === "submitted" && shot.pollUrl) {
        const polled = await pollVendor(deps.fetchImpl, shot.pollUrl, vendorHeaders(deps.env, "heygen"))
        Object.assign(shot, applyVendor(shot, polled, "heygen"))
        continue
      }
      const callback = callbackFor(deps, job, shot)
      const submitted = await submitHeygen({
        env: deps.env,
        fetchImpl: deps.fetchImpl,
        title: job.title,
        avatarId: job.project?.avatarId || "",
        audioUrl: shot.audioUrl,
        aspect: job.brief?.aspect || "16:9",
        engine: look.engine as "heygen-avatar-6" | "heygen-avatar-6-turbo",
        motion: `${shot.transition} ${shot.camera} ${shot.visual}`.trim(),
        callbackUrl: callback.url,
        callbackId: callback.id,
      })
      Object.assign(shot, applyVendor(shot, submitted, "heygen"))
    }
  } else if (provider === "grok") {
    note = [note, "Grok is filming Ava. This voice is not her ElevenLabs clone. A custom voice file is partner-only at xAI."].filter(Boolean).join(" ")
    for (const shot of shots) {
      if (shot.role !== "talking" || shot.status === "ready") continue
      if (shot.status === "submitted" && shot.pollUrl) {
        const polled = await pollVendor(deps.fetchImpl, shot.pollUrl, vendorHeaders(deps.env, "grok"))
        Object.assign(shot, applyVendor(shot, polled, "grok"))
        continue
      }
      const submitted = await submitGrok({
        env: deps.env,
        fetchImpl: deps.fetchImpl,
        prompt: `The woman from <IMAGE_0> speaks to camera, same face and hair. ${shot.visual} ${shot.camera} She says: ${shot.caption}`,
        durationMs: shot.endMs - shot.startMs,
        aspect: job.brief?.aspect || "16:9",
        referenceUrls: referenceImageUrls(deps.env),
        withAudio: true,
      })
      Object.assign(shot, applyVendor(shot, submitted, "grok"))
    }
  }
  const talking = shots.filter((shot) => shot.role === "talking")
  const failed = talking.find((shot) => shot.status === "failed")
  if (failed) return blocked({ ...job, shots }, [failed.error || "Ava's shot failed."], note)
  if (talking.some((shot) => shot.status !== "ready" && shot.status !== "skipped")) {
    return touch(job, { stage: "avatar", shots, note })
  }
  return touch(job, { stage: "broll", shots, note })
}

async function filmBroll(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  const provider = brollProvider(deps.env)
  const shots = job.shots.map((shot) => ({ ...shot }))
  const plates = shots.filter((shot) => shot.role !== "talking")
  if (!plates.length) return touch(job, { stage: "lipsync", shots })
  for (const shot of plates) {
    if (shot.status === "ready") continue
    if (shot.status === "submitted" && shot.pollUrl) {
      const polled = await pollVendor(deps.fetchImpl, shot.pollUrl, vendorHeaders(deps.env, provider === "fal" ? "fal" : "grok"))
      Object.assign(shot, applyVendor(shot, polled, provider))
      continue
    }
    const refs = shot.role === "broll-ava" ? referenceImageUrls(deps.env) : []
    const prompt = shot.role === "broll-ava"
      ? `The woman from <IMAGE_0>, same face and wardrobe, ${shot.visual} ${shot.camera} No new person.`
      : `${shot.visual} ${shot.camera} Cinematic, no readable fake text, no new presenter.`
    const submitted = provider === "fal"
      ? await submitFalClip({
        env: deps.env,
        fetchImpl: deps.fetchImpl,
        prompt,
        durationMs: shot.endMs - shot.startMs,
        aspect: job.brief?.aspect || "16:9",
        imageUrl: refs[0] || "",
      })
      : await submitGrok({
        env: deps.env,
        fetchImpl: deps.fetchImpl,
        prompt,
        durationMs: shot.endMs - shot.startMs,
        aspect: job.brief?.aspect || "16:9",
        referenceUrls: refs,
        withAudio: false,
      })
    Object.assign(shot, applyVendor(shot, submitted, provider))
  }
  const failed = plates.find((shot) => shot.status === "failed")
  if (failed) return blocked({ ...job, shots }, [failed.error || "A B-roll shot failed."])
  if (plates.some((shot) => shot.status !== "ready")) return touch(job, { stage: "broll", shots })
  return touch(job, { stage: "lipsync", shots })
}

async function maybeLipsync(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  const shots = job.shots.map((shot) => ({ ...shot }))
  if (!lipsyncEnabled(deps.env)) {
    const note = shots.some((shot) => shot.role === "broll-ava")
      ? [job.note, "The optional lip-sync pass is off, so cutaways keep the picture as filmed."].filter(Boolean).join(" ")
      : job.note
    return touch(job, { stage: "music", shots, note })
  }
  for (const shot of shots) {
    if (shot.role !== "broll-ava") continue
    if (shot.provider === "sync" && shot.status === "ready") continue
    if (shot.provider === "sync" && shot.status === "submitted" && shot.pollUrl) {
      const polled = await pollVendor(deps.fetchImpl, shot.pollUrl, vendorHeaders(deps.env, "sync"))
      if (polled.state === "failed") {
        shot.error = polled.message
        shot.provider = "sync"
        continue
      }
      Object.assign(shot, applyVendor(shot, polled, "sync"))
      continue
    }
    if (shot.provider === "sync") continue
    const submitted = await submitLipsync(deps.env, deps.fetchImpl, shot)
    if (submitted.state === "failed") {
      shot.error = submitted.message
      continue
    }
    Object.assign(shot, applyVendor(shot, submitted, "sync"))
  }
  if (shots.some((shot) => shot.role === "broll-ava" && shot.provider === "sync" && shot.status === "submitted")) {
    return touch(job, { stage: "lipsync", shots })
  }
  return touch(job, { stage: "music", shots })
}

async function addMusic(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  if (job.musicUrl) return touch(job, { stage: "assemble" })
  if (!falKey(deps.env)) {
    return touch(job, { stage: "assemble", note: [job.note, "No soundtrack was added because music is not connected."].filter(Boolean).join(" ") })
  }
  if (job.stage === "music" && job.shots.some((shot) => shot.provider === "music" && shot.status === "submitted")) {
    const holder = job.shots.find((shot) => shot.provider === "music")
    if (holder?.pollUrl) {
      const polled = await pollVendor(deps.fetchImpl, holder.pollUrl, vendorHeaders(deps.env, "music"))
      if (polled.state === "ready") return touch(job, { stage: "assemble", musicUrl: polled.url })
      if (polled.state === "failed") {
        return touch(job, { stage: "assemble", note: [job.note, "The music service did not return a track. The film continues without one."].filter(Boolean).join(" ") })
      }
      return job
    }
  }
  const submitted = await submitMusic(deps.env, deps.fetchImpl, job.title, job.project?.scenes.at(-1)?.endMs || 0)
  if (submitted.state === "ready") return touch(job, { stage: "assemble", musicUrl: submitted.url })
  if (submitted.state === "failed") {
    return touch(job, { stage: "assemble", note: [job.note, "The music service did not return a track. The film continues without one."].filter(Boolean).join(" ") })
  }
  const marker: PlannedShot = {
    id: "music",
    index: -1,
    role: "broll",
    spoken: "",
    caption: "",
    visual: "",
    camera: "",
    transition: "",
    startMs: 0,
    endMs: 0,
    audioUrl: "",
    provider: "music",
    providerId: submitted.id,
    pollUrl: submitted.pollUrl,
    status: "submitted",
    outputUrl: "",
    error: "",
  }
  return touch(job, { stage: "music", shots: [...job.shots, marker] })
}

async function assemble(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  if (job.masterUrl && job.composition) return touch(job, { stage: "quality" })
  const pictureShots = job.shots.filter((shot) => shot.id !== "music" && shot.outputUrl)
  if (!pictureShots.length) return blocked(job, ["There was no picture to cut."])
  const timeline = buildTimeline({
    aspect: job.brief?.aspect || "16:9",
    shots: job.shots.filter((shot) => shot.id !== "music"),
    musicUrl: job.musicUrl,
  })
  const rendered = await deps.render(timeline)
  if ("error" in rendered) return blocked({ ...job, composition: timeline }, [rendered.error])
  let masterUrl = rendered.url
  if (rendered.bytes) {
    try {
      const stored = await deps.store.putAsset({ jobId: job.id, name: "master.mp4", bytes: rendered.bytes, contentType: "video/mp4" })
      masterUrl = stored.url
      job.assets = [...job.assets, { kind: "master", path: stored.path, url: stored.url }]
    } catch (error) {
      const message = error instanceof Error ? error.message : "The finished film could not be stored."
      return blocked({ ...job, composition: timeline }, [message])
    }
  }
  if (!masterUrl) return blocked({ ...job, composition: timeline }, ["The film editor did not return a file."])
  return touch(job, {
    stage: "quality",
    composition: timeline,
    masterUrl,
    picture: {
      width: rendered.width,
      height: rendered.height,
      fps: rendered.fps,
      videoDurationMs: rendered.videoDurationMs,
      audioDurationMs: rendered.audioDurationMs,
    },
  })
}

async function checkQuality(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  if (!job.project || !job.composition) return blocked(job, ["The cut was missing its shot list."])
  const measured = await deps.probe?.(job.masterUrl).catch(() => ({} as Partial<MediaProbe>)) || {}
  const picture = job.picture
  const probe: MediaProbe = {
    width: picture?.width || job.composition.width,
    height: picture?.height || job.composition.height,
    fps: picture?.fps || job.composition.fps,
    videoDurationMs: picture?.videoDurationMs || job.composition.durationMs,
    audioDurationMs: picture?.audioDurationMs || job.composition.durationMs,
    videoUrl: job.masterUrl,
    ...measured,
  }
  const decision = decide([
    ...localChecks(job.project, { containsBanned: (text) => deps.tools.omitBannedLine(text) !== text }),
    ...probeChecks(job.project, probe),
  ], job.attempt)
  if (decision.retryable) {
    return touch(job, {
      stage: "assemble",
      attempt: job.attempt + 1,
      masterUrl: "",
      quality: decision,
      note: "A quality check failed, so the film is being cut again. The failed file was not published.",
    })
  }
  if (!decision.review) return blocked({ ...job, quality: decision }, decision.reasons)
  const reasons = decision.reasons.length
    ? decision.reasons
    : ["Watch the film, then approve it. It is not published yet."]
  return touch(job, { stage: "review", quality: decision, reasons, note: job.note })
}

export async function advanceVideoJob(job: VideoJob, deps: PipelineDeps): Promise<VideoJob> {
  if (job.stage === "script") return writeScript(job, deps)
  if (job.stage === "voice") return recordVoice(job, deps)
  if (job.stage === "avatar") return filmAvatar(job, deps)
  if (job.stage === "broll") return filmBroll(job, deps)
  if (job.stage === "lipsync") return maybeLipsync(job, deps)
  if (job.stage === "music") return addMusic(job, deps)
  if (job.stage === "assemble") return assemble(job, deps)
  if (job.stage === "quality") return checkQuality(job, deps)
  return job
}

export async function runVideoJob(job: VideoJob, deps: PipelineDeps, budgetMs = 90000): Promise<VideoJob> {
  const started = Date.now()
  let current = job
  for (let guard = 0; guard < 48 && Date.now() - started < budgetMs; guard += 1) {
    const before = `${current.stage}|${current.shots.map((shot) => `${shot.id}:${shot.status}:${shot.providerId}`).join(",")}|${current.masterUrl}`
    current = await advanceVideoJob(current, deps)
    await deps.store.save(current)
    const after = `${current.stage}|${current.shots.map((shot) => `${shot.id}:${shot.status}:${shot.providerId}`).join(",")}|${current.masterUrl}`
    if (current.stage === "review" || current.stage === "published" || current.stage === "blocked") break
    if (before === after) break
  }
  return current
}

export async function startVideoJob(input: {
  brief: VideoBrief
  deps: PipelineDeps
}): Promise<VideoJob> {
  const job = createVideoJob({ app: input.deps.app, ownerId: input.deps.ownerId, brief: input.brief })
  await input.deps.store.save(job)
  return runVideoJob(job, input.deps)
}

export function approveVideoJob(job: VideoJob): VideoJob | { error: string } {
  if (job.stage !== "review") return { error: "This film is not waiting for approval." }
  if (!job.masterUrl) return { error: "There is no film to approve." }
  return touch(job, {
    stage: "published",
    approvedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    reasons: [],
    note: [job.note, "Approved. This is the film to publish."].filter(Boolean).join(" "),
  })
}

export function jobSummary(job: VideoJob) {
  const delivery = job.stage === "published" ? "final" : job.stage === "review" ? "review" : job.stage === "blocked" ? "blocked" : "working"
  return {
    delivery,
    delivered: job.stage === "published",
    jobId: job.id,
    stage: job.stage,
    stageLabel: stageLabel(job.stage),
    videoUrl: job.stage === "blocked" ? "" : job.masterUrl,
    soundtrackUrl: job.musicUrl,
    reasons: job.reasons,
    note: job.note,
    cost: job.cost,
    title: job.title,
    approvedAt: job.approvedAt,
    shots: job.shots.filter((shot) => shot.id !== "music").map((shot) => ({
      id: shot.id,
      role: shot.role,
      caption: shot.caption,
      visual: shot.visual,
      status: shot.status,
      startMs: shot.startMs,
      endMs: shot.endMs,
    })),
  }
}

export async function sweepJobs(deps: PipelineDeps) {
  const waiting = await deps.store.waiting()
  const advanced: string[] = []
  for (const job of waiting) {
    const next = await runVideoJob(job, deps, 20000)
    if (next.stage !== job.stage || next.masterUrl !== job.masterUrl) advanced.push(next.id)
  }
  return { ok: true, checked: waiting.length, advanced }
}

export function webhookOk(env: Env, token: string) {
  const secret = env.VIDEO_WEBHOOK_SECRET?.trim() || ""
  if (!secret) return false
  return token === secret
}

export function heygenKeyPresent(env: Env) {
  return Boolean(heygenKey(env))
}

export function xaiPresent(env: Env) {
  return Boolean(xaiKey(env))
}
