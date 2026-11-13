import { frameBudgetMs, resolutionMeetsFloor, VIDEO_QUALITY_POLICY } from "./quality"
import { captionsAligned } from "./captions"
import type { DeliveryDecision, MediaProbe, QualityCheck, VideoProject } from "./types"

function check(id: string, label: string, state: QualityCheck["state"], detail: string): QualityCheck {
  return { id, label, state, detail }
}

export function localChecks(project: VideoProject, tools: { containsBanned: (text: string) => boolean }): QualityCheck[] {
  const checks: QualityCheck[] = []
  const banned = project.scenes.some((scene) => tools.containsBanned(scene.spoken) || tools.containsBanned(scene.caption))
    || tools.containsBanned(project.script)
  checks.push(check(
    "banned-line",
    "Banned line",
    banned ? "fail" : "pass",
    banned ? "A banned line is still in the script." : "The banned line is not in the script or the voice-over.",
  ))

  const captions = captionsAligned(project.scenes)
  checks.push(check("captions", "Captions", captions.ok ? "pass" : "fail", captions.detail))

  const talking = project.scenes.filter((scene) => scene.talking)
  if (!talking.length) {
    checks.push(check("consistency", "Same face, voice, and light", "not_applicable", "This cut has no talking presenter."))
  } else {
    const same = (values: string[]) => values.every((value) => value === values[0])
    const avatar = same(talking.map((scene) => scene.avatarId))
    const voice = same(talking.map((scene) => scene.voiceId))
    const light = project.scenes.every((scene) => scene.lighting === project.scenes[0]?.lighting)
    const flow = project.scenes.every((scene, index) => index === 0 || scene.transition.toLowerCase().includes("dissolve"))
    const ok = avatar && voice && light && flow
    checks.push(check(
      "consistency",
      "Same face, voice, and light",
      ok ? "pass" : "fail",
      ok
        ? "Every scene keeps one avatar, one voice, one lighting setup, and a dissolve between cuts."
        : "A scene changed the face, the voice, the light, or skipped the dissolve.",
    ))
  }

  const freeze = project.scenes.some((scene) => /freeze frame|hold the last frame/i.test(`${scene.visual} ${scene.camera} ${scene.transition}`))
  checks.push(check(
    "motion",
    "Motion",
    freeze ? "fail" : "pass",
    freeze ? "A scene asks the picture to freeze." : "Scenes ask for a moving camera and a dissolve, not a frozen hold.",
  ))
  return checks
}

export function probeChecks(project: VideoProject, probe: MediaProbe): QualityCheck[] {
  const checks: QualityCheck[] = []
  const shortEdge = probe.width && probe.height ? Math.min(probe.width, probe.height) : undefined
  if (!probe.resolution && shortEdge === undefined) {
    checks.push(check("resolution", "Resolution", "not_measured", "The video service did not say how large the file is."))
  } else if (resolutionMeetsFloor(probe.resolution, shortEdge)) {
    const note = probe.resolutionNote ? ` ${probe.resolutionNote}` : ""
    checks.push(check("resolution", "Resolution", "pass", `The file meets the 1080p floor.${note}`))
  } else {
    checks.push(check("resolution", "Resolution", "fail", "The file is below 1080p. It was not delivered."))
  }

  const fps = probe.fps
  if (typeof fps !== "number") {
    checks.push(check("fps", "Frame rate", "not_measured", "The video service did not say the frame rate."))
  } else if (fps + 0.01 < VIDEO_QUALITY_POLICY.minFps) {
    checks.push(check("fps", "Frame rate", "fail", `The file is ${fps} fps, under the ${VIDEO_QUALITY_POLICY.minFps} fps floor.`))
  } else {
    checks.push(check("fps", "Frame rate", "pass", `The file is ${fps} fps, which is the top rate this render path documents.`))
  }

  const talking = project.scenes.some((scene) => scene.talking)
  if (!talking) {
    checks.push(check("lip-sync", "Lip sync", "not_applicable", "No talking face is in this cut."))
  } else if (probe.lipSyncOffsetMs === null || probe.lipSyncOffsetMs === undefined) {
    checks.push(check(
      "lip-sync",
      "Lip sync",
      "not_measured",
      "Lip-sync timing was not confirmed, so this was not marked as a finished video.",
    ))
  } else if (Math.abs(probe.lipSyncOffsetMs) <= frameBudgetMs(fps || VIDEO_QUALITY_POLICY.heygenAvatarFps) + 0.01) {
    checks.push(check("lip-sync", "Lip sync", "pass", "The mouth lands inside one frame of the voice."))
  } else {
    checks.push(check("lip-sync", "Lip sync", "fail", "The mouth is more than one frame off the voice."))
  }

  if (typeof probe.videoDurationMs !== "number" || typeof probe.audioDurationMs !== "number") {
    checks.push(check("duration", "Sound and picture length", "not_measured", "The video service did not report both lengths."))
  } else if (Math.abs(probe.videoDurationMs - probe.audioDurationMs) <= VIDEO_QUALITY_POLICY.durationToleranceMs) {
    checks.push(check("duration", "Sound and picture length", "pass", "The voice and the picture end together."))
  } else {
    checks.push(check("duration", "Sound and picture length", "fail", "The voice and the picture do not end together."))
  }

  if (typeof probe.blackFrameCount !== "number") {
    checks.push(check("black-frames", "Black frames", "not_measured", "Black frames were not measured."))
  } else if (probe.blackFrameCount > VIDEO_QUALITY_POLICY.maxBlackFrames) {
    checks.push(check("black-frames", "Black frames", "fail", "The file has a black frame."))
  } else {
    checks.push(check("black-frames", "Black frames", "pass", "No black frame was reported."))
  }

  if (typeof probe.frozenSeconds !== "number") {
    checks.push(check("frozen", "Frozen frames", "not_measured", "Frozen frames were not measured."))
  } else if (probe.frozenSeconds > VIDEO_QUALITY_POLICY.maxFrozenSeconds) {
    checks.push(check("frozen", "Frozen frames", "fail", "The picture holds still longer than a blink."))
  } else {
    checks.push(check("frozen", "Frozen frames", "pass", "No frozen hold was reported."))
  }
  return checks
}

const RETRYABLE = new Set(["lip-sync", "duration", "black-frames", "frozen", "fps"])

export function decide(checks: QualityCheck[], attempt: number): DeliveryDecision {
  const reasons = checks
    .filter((item) => item.state === "fail" || item.state === "not_measured")
    .map((item) => item.detail)
  const deliver = reasons.length === 0
  const failedIds = checks.filter((item) => item.state === "fail").map((item) => item.id)
  const measuredGap = checks.some((item) => item.state === "not_measured")
  const retryable = !deliver
    && attempt < VIDEO_QUALITY_POLICY.maxAttempts
    && failedIds.every((id) => RETRYABLE.has(id))
    && !measuredGap
  return { deliver, retryable, reasons, checks }
}

export function expectedDurationMs(project: VideoProject) {
  const last = project.scenes[project.scenes.length - 1]
  return last ? last.endMs : 0
}
