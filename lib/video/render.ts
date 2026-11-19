import { capabilityReport, musicReady, type Env } from "./providers"
import { ACE_STEP_MODEL, aceStepBody, falQueueUrl } from "./fal"

export function publicStatus(env: Env) {
  return capabilityReport(env)
}

export function musicRequest(env: Env, title: string, durationMs = 180000) {
  if (!musicReady(env)) return null
  const key = env.FAL_KEY?.trim() || env.VIDEO_MUSIC_API_KEY?.trim() || ""
  const url = env.FAL_KEY?.trim() ? falQueueUrl(ACE_STEP_MODEL) : env.VIDEO_MUSIC_API_URL!.trim()
  return { url, key, body: aceStepBody({ title, durationMs }) }
}
