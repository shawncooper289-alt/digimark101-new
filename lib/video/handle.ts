import { decide, localChecks, probeChecks } from "./gate"
import { readHeygenPayload, fourKRejected } from "./heygen"
import { handoffCaption, readNetwork } from "./handoff"
import { prepareProject } from "./prepare"
import { previewDraftHtml, previewFileName } from "./preview"
import { musicRequest, publicStatus, renderCall, statusCall } from "./render"
import { VIDEO_QUALITY_POLICY, type VideoResolution } from "./quality"
import type { TextTools } from "./text"
import type { Env } from "./providers"
import type { MediaProbe, VideoProject } from "./types"

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

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

function blocked(project: VideoProject | null, reasons: string[], extra: Record<string, unknown> = {}) {
  return {
    status: 200,
    body: {
      delivery: "blocked",
      delivered: false,
      reasons,
      project: project ? publicProject(project) : null,
      ...extra,
    },
  }
}

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

function probeFrom(payload: ReturnType<typeof readHeygenPayload>): MediaProbe {
  return {
    status: payload.status,
    resolution: payload.resolution,
    resolutionNote: payload.resolutionNote,
    width: payload.width,
    height: payload.height,
    fps: payload.fps,
    videoDurationMs: payload.videoDurationMs,
    audioDurationMs: payload.audioDurationMs,
    lipSyncOffsetMs: payload.lipSyncOffsetMs,
    blackFrameCount: payload.blackFrameCount,
    frozenSeconds: payload.frozenSeconds,
    videoUrl: payload.videoUrl,
    subtitleUrl: payload.subtitleUrl,
  }
}

function finished(project: VideoProject, probe: MediaProbe, picture: string, soundtrack: string): { status: number; body: Record<string, unknown> } {
  return {
    status: 200,
    body: {
      delivery: "final",
      delivered: true,
      videoUrl: probe.videoUrl || "",
      subtitleUrl: probe.subtitleUrl || "",
      soundtrackUrl: soundtrack,
      picture,
      resolution: probe.resolution || "",
      resolutionNote: probe.resolutionNote || "",
      project: publicProject(project),
      reasons: [],
    },
  }
}

export async function handleVideoRequest(input: {
  action: string
  payload: unknown
  env: Env
  tools: TextTools
  fetchImpl?: FetchLike
}): Promise<{ status: number; body: Record<string, unknown> }> {
  const fetchImpl = input.fetchImpl || globalThis.fetch
  const env = input.env
  if (input.action === "capabilities") {
    return { status: 200, body: publicStatus(env) as unknown as Record<string, unknown> }
  }

  const record = input.payload && typeof input.payload === "object" ? input.payload as Record<string, unknown> : {}
  const prepared = prepareProject(record.brief ?? record, env, input.tools)
  if ("error" in prepared) return { status: 400, body: { error: prepared.error } }
  const project = prepared.project

  if (input.action === "prepare" || input.action === "preview") {
    const local = localChecks(project, { containsBanned: (text) => input.tools.omitBannedLine(text) !== text })
    const problems = local.filter((item) => item.state === "fail").map((item) => item.detail)
    if (problems.length) return blocked(project, problems)
    if (input.action === "prepare") {
      return { status: 200, body: { delivery: "script", delivered: false, project: publicProject(project) } }
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
      },
    }
  }

  if (input.action === "render" || input.action === "status") {
    const attempt = Math.min(VIDEO_QUALITY_POLICY.maxAttempts, Math.max(1, Number(record.attempt) || 1))
    const asked = record.resolution === "1080p" ? "1080p" : "4k"
    const resolution = asked as VideoResolution
    if (input.action === "status") {
      const provider = typeof record.provider === "string" ? record.provider : ""
      const videoId = typeof record.videoId === "string" ? record.videoId : ""
      const call = statusCall(env, provider, videoId)
      if (!call) return blocked(project, ["That render could not be checked. Nothing was marked finished."])
      const response = await fetchImpl(call.url, { headers: call.headers, signal: AbortSignal.timeout(20000) }).catch(() => null)
      if (!response) return { status: 200, body: { delivery: "rendering", delivered: false, videoId, provider, attempt, project: publicProject(project) } }
      const payload = await readJson(response)
      const parsed = readHeygenPayload(payload)
      if (!response.ok || parsed.errorMessage) {
        return blocked(project, [parsed.errorMessage || "The video service rejected the status check. Nothing was marked finished."])
      }
      if (parsed.status === "failed" || parsed.status === "error") {
        return blocked(project, [parsed.errorMessage || "The render failed. Nothing was marked finished."], { attempt })
      }
      const stillWorking = !parsed.status || /wait|pending|process|queue|render/.test(parsed.status)
      if (stillWorking && parsed.status !== "completed" && parsed.status !== "complete" && parsed.status !== "ready") {
        return { status: 200, body: { delivery: "rendering", delivered: false, videoId, provider, attempt, project: publicProject(project) } }
      }
      const probe = probeFrom(parsed)
      if (!probe.videoUrl) return blocked(project, ["The video service did not return a file. Nothing was marked finished."], { attempt })
      const decision = decide([...localChecks(project, { containsBanned: (text) => input.tools.omitBannedLine(text) !== text }), ...probeChecks(project, probe)], attempt)
      if (decision.deliver) {
        const soundtrack = await requestMusic(env, project.title, fetchImpl)
        return finished(project, probe, "Finished video.", soundtrack)
      }
      if (decision.retryable) {
        const next = await startRender(project, env, input.tools, resolution, fetchImpl)
        if (next.body.delivery === "rendering") {
          return {
            status: 200,
            body: {
              ...next.body,
              attempt: attempt + 1,
              reasons: decision.reasons,
              note: "A quality check failed, so another render was started. The failed file was not delivered.",
            },
          }
        }
        return { status: next.status, body: next.body }
      }
      return blocked(project, decision.reasons, { attempt, delivered: false })
    }

    return startRender(project, env, input.tools, resolution, fetchImpl)
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

async function requestMusic(env: Env, title: string, fetchImpl: FetchLike) {
  const music = musicRequest(env, title)
  if (!music) return ""
  const response = await fetchImpl(music.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${music.key}`, "Content-Type": "application/json" },
    body: JSON.stringify(music.body),
    signal: AbortSignal.timeout(20000),
  }).catch(() => null)
  if (!response?.ok) return ""
  const payload = await readJson(response)
  const parsed = readHeygenPayload(payload)
  return parsed.videoUrl || ""
}

async function startRender(
  project: VideoProject,
  env: Env,
  tools: TextTools,
  resolution: VideoResolution,
  fetchImpl: FetchLike,
): Promise<{ status: number; body: Record<string, unknown>; delivery?: string }> {
  let note = ""
  let current = resolution
  for (let pass = 0; pass < 2; pass += 1) {
    const call = renderCall(project, env, tools, current)
    if (!call.ok) return blocked(project, call.reasons)
    const response = await fetchImpl(call.url, {
      method: "POST",
      headers: call.headers,
      body: JSON.stringify(call.body),
      signal: AbortSignal.timeout(30000),
    }).catch(() => null)
    if (!response) return blocked(project, ["The video service did not answer. Nothing was marked finished."])
    const payload = await readJson(response)
    const parsed = readHeygenPayload(payload)
    if (!response.ok || parsed.errorMessage) {
      if (current === "4k" && fourKRejected(parsed.errorMessage || "")) {
        current = "1080p"
        note = "4K was refused, so the next render asked for 1080p, which is still the premium floor."
        continue
      }
      return blocked(project, [parsed.errorMessage || "The video service rejected the render. Nothing was marked finished."], { note })
    }
    const probe = probeFrom(parsed)
    if (probe.resolutionNote) note = [note, probe.resolutionNote].filter(Boolean).join(" ")
    if (parsed.status === "failed" || parsed.status === "error") {
      return blocked(project, [parsed.errorMessage || "The render failed. Nothing was marked finished."], { note })
    }
    const done = parsed.status === "completed" || parsed.status === "complete" || parsed.status === "ready"
    if (!done) {
      if (!parsed.videoId) return blocked(project, ["The video service did not return a job id. Nothing was marked finished."], { note })
      return {
        status: 200,
        delivery: "rendering",
        body: {
          delivery: "rendering",
          delivered: false,
          videoId: parsed.videoId,
          provider: call.provider,
          attempt: 1,
          picture: call.picture,
          note,
          project: publicProject(project),
        },
      }
    }
    if (!probe.videoUrl) return blocked(project, ["The video service did not return a file. Nothing was marked finished."], { note })
    const decision = decide([...localChecks(project, { containsBanned: (text) => tools.omitBannedLine(text) !== text }), ...probeChecks(project, probe)], 1)
    if (!decision.deliver) return blocked(project, decision.reasons, { note, delivered: false })
    const soundtrack = await requestMusic(env, project.title, fetchImpl)
    const result = finished(project, probe, call.picture, soundtrack)
    if (note) result.body.note = note
    return result
  }
  return blocked(project, ["The video service would not render at 1080p or 4K. Nothing was marked finished."])
}
