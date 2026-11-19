import { localChecks } from "./gate"
import { handoffCaption, readNetwork } from "./handoff"
import { approveVideoJob, jobSummary, runVideoJob, startVideoJob, sweepJobs, webhookOk, type PipelineDeps } from "./pipeline"
import { prepareProject } from "./prepare"
import { previewDraftHtml, previewFileName } from "./preview"
import { publicStatus } from "./render"
import { planShots } from "./shots"
import { estimateShots } from "./cost"
import { memoryVideoStore, type VideoStore } from "./job"
import { supabaseVideoStore } from "./supabase-job"
import { brollProvider, referenceImageUrls, type Env } from "./providers"
import type { TextTools } from "./text"
import type { VideoProject } from "./types"
import type { FetchLike } from "./vendors"

function publicProject(project: VideoProject) {
  return {
    title: project.title,
    script: project.script,
    spokenSeconds: project.spokenSeconds,
    requestedSeconds: project.requestedSeconds,
    lengthNote: project.lengthNote,
    lighting: project.lighting,
    voiceLabel: project.voiceLabel,
    aspect: project.brief.aspect,
    style: project.brief.style,
    presenter: project.brief.presenter,
    attire: project.brief.attire,
    ignoredOverrides: project.ignoredOverrides,
    next: project.next,
    captionsVtt: project.captionsVtt,
    captionsSrt: project.captionsSrt,
    scenes: project.scenes.map((scene) => ({
      caption: scene.caption,
      visual: scene.visual,
      camera: scene.camera,
      transition: scene.transition,
      lighting: scene.lighting,
      startMs: scene.startMs,
      endMs: scene.endMs,
      talking: scene.talking,
    })),
  }
}

function depsFor(input: {
  env: Env
  tools: TextTools
  fetchImpl: FetchLike
  store: VideoStore
  app: "studio" | "office"
  ownerId?: string
  callbackBase?: string
  editorReady?: PipelineDeps["editorReady"]
  render?: PipelineDeps["render"]
  probe?: PipelineDeps["probe"]
}): PipelineDeps {
  return {
    env: input.env,
    tools: input.tools,
    fetchImpl: input.fetchImpl,
    store: input.store,
    app: input.app,
    ownerId: input.ownerId,
    callbackBase: input.callbackBase,
    editorReady: input.editorReady || (async () => ({ ok: false, reason: "The film editor is not configured. Nothing was sent to a paid service." })),
    render: input.render || (async () => ({ error: "The film editor is not configured." })),
    probe: input.probe,
  }
}

export async function handleVideoRequest(input: {
  action: string
  payload: unknown
  env: Env
  tools: TextTools
  fetchImpl?: FetchLike
  store?: VideoStore | null
  app?: "studio" | "office"
  ownerId?: string
  callbackBase?: string
  editorReady?: PipelineDeps["editorReady"]
  render?: PipelineDeps["render"]
  probe?: PipelineDeps["probe"]
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const fetchImpl = input.fetchImpl || globalThis.fetch
  const env = input.env
  const app = input.app || "studio"
  if (input.action === "capabilities") {
    return { status: 200, body: publicStatus(env) as unknown as Record<string, unknown> }
  }

  const store = input.store !== undefined ? input.store : null
  const durableStore = () => store || supabaseVideoStore(env, fetchImpl as typeof fetch)
  const record = input.payload && typeof input.payload === "object" ? input.payload as Record<string, unknown> : {}

  if (input.action === "library") {
    const library = durableStore()
    if (!library) return { status: 200, body: { jobs: [], note: "The video library is not connected. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." } }
    const jobs = (await library.list(12)).filter((job) => !input.ownerId || (job.ownerId === input.ownerId && job.app === app))
    return {
      status: 200,
      body: {
        jobs: jobs.map((job) => ({ id: job.id, title: job.title, stage: job.stage, stageLabel: jobSummary(job).stageLabel, updatedAt: job.updatedAt })),
      },
    }
  }

  if (input.action === "sweep") {
    const library = durableStore()
    if (!library) return { status: 200, body: { ok: false, error: "The video library is not connected." } }
    const result = await sweepJobs(depsFor({ ...input, env, fetchImpl, store: library, app }))
    return { status: 200, body: result }
  }

  if (input.action === "job" || input.action === "approve" || input.action === "vendor-event") {
    const library = durableStore()
    if (!library) return { status: 200, body: { delivery: "blocked", delivered: false, reasons: ["The video library is not connected."] } }
    const jobId = typeof record.jobId === "string" ? record.jobId : ""
    const job = jobId ? await library.load(jobId) : null
    if (!job) return { status: 404, body: { error: "That film could not be found." } }
    const privileged = input.action === "vendor-event"
    if (!privileged && input.ownerId && (job.ownerId !== input.ownerId || job.app !== app)) {
      return { status: 404, body: { error: "That film could not be found." } }
    }
    if (input.action === "job" && (job.stage === "review" || job.stage === "published" || job.stage === "blocked")) {
      const project = job.project ? publicProject(job.project) : null
      return { status: 200, body: { ...jobSummary(job), project } }
    }
    if (input.action === "vendor-event") {
      const token = typeof record.token === "string" ? record.token : ""
      if (!webhookOk(env, token)) return { status: 401, body: { error: "That callback was refused." } }
      const shotId = typeof record.shotId === "string" ? record.shotId : ""
      const providerId = typeof record.providerId === "string" ? record.providerId : ""
      const url = typeof record.url === "string" ? record.url : ""
      const status = typeof record.status === "string" ? record.status.toLowerCase() : ""
      const error = typeof record.error === "string" ? record.error : ""
      job.shots = job.shots.map((shot) => {
        if (shot.id !== shotId && shot.providerId !== providerId) return shot
        if (url && ["completed", "complete", "ready", "done", "ok"].includes(status)) {
          return { ...shot, status: "ready", outputUrl: url, error: "" }
        }
        if (["failed", "error"].includes(status)) return { ...shot, status: "failed", error: error || "The shot failed." }
        return shot
      })
      await library.save(job)
    }
    if (input.action === "approve") {
      const approved = approveVideoJob(job)
      if ("error" in approved) return { status: 400, body: { error: approved.error } }
      await library.save(approved)
      const project = approved.project ? publicProject(approved.project) : null
      return { status: 200, body: { ...jobSummary(approved), project } }
    }
    const next = await runVideoJob(job, depsFor({ ...input, env, fetchImpl, store: library, app }))
    const project = next.project ? publicProject(next.project) : null
    return { status: 200, body: { ...jobSummary(next), project } }
  }

  const prepared = prepareProject(record.brief ?? record, env, input.tools)
  if ("error" in prepared) return { status: 400, body: { error: prepared.error } }
  const project = prepared.project

  if (input.action === "prepare" || input.action === "preview") {
    const local = localChecks(project, { containsBanned: (text) => input.tools.omitBannedLine(text) !== text })
    const problems = local.filter((item) => item.state === "fail").map((item) => item.detail)
    if (problems.length) {
      return { status: 200, body: { delivery: "blocked", delivered: false, reasons: problems, project: publicProject(project) } }
    }
    const shots = planShots(project, {
      allowBroll: brollProvider(env) !== "none" || project.brief.style !== "presenter",
      allowAvaCutaway: referenceImageUrls(env).length > 0,
    })
    const cost = estimateShots(shots, env, project.spokenScript)
    if (input.action === "prepare") {
      return { status: 200, body: { delivery: "script", delivered: false, project: publicProject(project), cost, shotCount: shots.length } }
    }
    return {
      status: 200,
      body: {
        delivery: "preview-draft",
        delivered: false,
        label: "Preview draft. This is not a finished video.",
        fileName: previewFileName(project.title),
        html: previewDraftHtml(project),
        project: publicProject(project),
        cost,
      },
    }
  }

  if (input.action === "render" || input.action === "produce") {
    const activeStore = durableStore()
    if (!activeStore) {
      return {
        status: 200,
        body: {
          delivery: "blocked",
          delivered: false,
          reasons: ["The video library is not connected. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Nothing was rendered."],
          project: publicProject(project),
        },
      }
    }
    const job = await startVideoJob({
      brief: project.brief,
      deps: depsFor({ ...input, env, fetchImpl, store: activeStore, app }),
    })
    return { status: 200, body: { ...jobSummary(job), project: job.project ? publicProject(job.project) : publicProject(project) } }
  }

  if (input.action === "handoff") {
    const delivery = record.delivery === "final" ? "final" : "preview-draft"
    const caption = input.tools.omitBannedLine(handoffCaption({
      title: project.title,
      script: project.script,
      delivery,
    }))
    return {
      status: 200,
      body: {
        delivery,
        delivered: false,
        platform: readNetwork(record.platform, project.brief.aspect),
        scheduledFor: typeof record.scheduledFor === "string" ? record.scheduledFor : "",
        caption,
        project: publicProject(project),
      },
    }
  }

  return { status: 400, body: { error: "That video action is not supported." } }
}

export { memoryVideoStore }
