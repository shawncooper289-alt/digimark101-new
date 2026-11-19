import { decodeBase64 } from "./base64"
import { elevenSpeechBody, elevenSpeechUrl, wordsFromAlignment, type ElevenAlignment } from "./eleven"
import { aceStepBody, falQueueUrl, falRequestUrl, klingBody, ACE_STEP_MODEL } from "./fal"
import { grokCreateUrl, grokStatusUrl, grokVideoRequest } from "./grok"
import { heygenAvatarRequest, heygenCreateUrl, heygenLookUrl, heygenStatusUrl, pickHeygenEngine, readHeygenPayload } from "./heygen"
import { syncCreateUrl, syncLipsyncBody, syncStatusUrl } from "./lipsync"
import {
  elevenKey,
  falKey,
  falModel,
  grokModel,
  heygenEngine,
  heygenKey,
  videoVoiceId,
  xaiKey,
  type Env,
} from "./providers"
import { VIDEO_QUALITY_POLICY } from "./quality"
import type { PlannedShot } from "./shots"
import type { AspectRatio } from "./types"

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type VendorState =
  | { state: "ready"; id: string; url: string; pollUrl: string }
  | { state: "pending"; id: string; pollUrl: string }
  | { state: "failed"; message: string }

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null
}

function pickString(source: UnknownRecord | null, keys: string[]) {
  if (!source) return ""
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

async function readBody(response: Response) {
  return response.json().catch(() => null)
}

export function mediaUrl(payload: unknown) {
  const root = record(payload)
  if (!root) return ""
  const direct = pickString(root, ["video_url", "audio_url", "url", "outputUrl", "output_url"])
  if (direct.startsWith("http")) return direct
  for (const key of ["data", "video", "audio", "payload", "output"]) {
    const nested = record(root[key])
    const url = pickString(nested, ["video_url", "audio_url", "url", "outputUrl"])
    if (url.startsWith("http")) return url
  }
  return ""
}

export function mediaStatus(payload: unknown) {
  const root = record(payload)
  const data = record(root?.data) || root
  return pickString(data, ["status"]).toLowerCase()
}

function doneStatus(status: string) {
  return ["completed", "complete", "ready", "done", "ok", "succeeded", "success"].includes(status)
}

function failedStatus(status: string) {
  return ["failed", "error", "cancelled", "canceled"].includes(status)
}

async function postJson(fetchImpl: FetchLike, url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  }).catch(() => null)
  if (!response) return { ok: false, status: 0, json: null as unknown, error: "The service did not answer." }
  const json = await readBody(response)
  const parsed = readHeygenPayload(json)
  const error = parsed.errorMessage || (!response.ok ? `The service returned ${response.status}.` : "")
  return { ok: response.ok && !parsed.errorMessage, status: response.status, json, error }
}

export async function resolveHeygenEngine(env: Env, fetchImpl: FetchLike, avatarId: string) {
  const preferred = heygenEngine(env)
  const response = await fetchImpl(heygenLookUrl(avatarId), {
    headers: { "X-Api-Key": heygenKey(env) },
    signal: AbortSignal.timeout(20000),
  }).catch(() => null)
  if (!response?.ok) return { engine: preferred, note: "" }
  const json = await readBody(response)
  const parsed = readHeygenPayload(json)
  const engine = pickHeygenEngine(preferred, parsed.supportedEngines)
  if (!engine) {
    return { engine: "" as const, note: "This avatar look does not list Avatar 6. In HeyGen, confirm supported_api_engines includes heygen-avatar-6-turbo." }
  }
  const note = engine === preferred ? "" : `The look does not list ${preferred}, so this shot uses ${engine}.`
  return { engine, note }
}

export async function submitHeygen(input: {
  env: Env
  fetchImpl: FetchLike
  title: string
  avatarId: string
  audioUrl: string
  aspect: AspectRatio
  engine: "heygen-avatar-6" | "heygen-avatar-6-turbo"
  motion: string
  callbackUrl: string
  callbackId: string
}): Promise<VendorState> {
  const body = heygenAvatarRequest({
    title: input.title,
    avatarId: input.avatarId,
    audioUrl: input.audioUrl,
    aspect: input.aspect,
    engine: input.engine,
    motionPrompt: input.motion,
    callbackUrl: input.callbackUrl,
    callbackId: input.callbackId,
  })
  if ("error" in body) return { state: "failed", message: body.error }
  const result = await postJson(input.fetchImpl, heygenCreateUrl(), { "X-Api-Key": heygenKey(input.env) }, body)
  if (!result.ok) return { state: "failed", message: result.error || "HeyGen rejected the shot." }
  const parsed = readHeygenPayload(result.json)
  if (!parsed.videoId) return { state: "failed", message: "HeyGen did not return a job id." }
  const pollUrl = heygenStatusUrl(parsed.videoId)
  if (parsed.videoUrl && doneStatus(parsed.status)) return { state: "ready", id: parsed.videoId, url: parsed.videoUrl, pollUrl }
  return { state: "pending", id: parsed.videoId, pollUrl }
}

export async function submitGrok(input: {
  env: Env
  fetchImpl: FetchLike
  prompt: string
  durationMs: number
  aspect: AspectRatio
  referenceUrls: string[]
  withAudio: boolean
}): Promise<VendorState> {
  const key = xaiKey(input.env)
  if (!key) return { state: "failed", message: "Grok is not connected. Add XAI_API_KEY." }
  const body = grokVideoRequest({
    model: grokModel(input.env),
    prompt: input.prompt,
    durationMs: input.durationMs,
    aspect: input.aspect,
    referenceUrls: input.referenceUrls,
    withAudio: input.withAudio,
  })
  const result = await postJson(input.fetchImpl, grokCreateUrl(), { Authorization: `Bearer ${key}` }, body)
  if (!result.ok) return { state: "failed", message: result.error || "Grok rejected the shot." }
  const root = record(result.json)
  const id = pickString(root, ["request_id", "id"])
  if (!id) return { state: "failed", message: "Grok did not return a request id." }
  const url = mediaUrl(result.json)
  const pollUrl = grokStatusUrl(id)
  if (url && doneStatus(mediaStatus(result.json))) return { state: "ready", id, url, pollUrl }
  return { state: "pending", id, pollUrl }
}

export async function submitFalClip(input: {
  env: Env
  fetchImpl: FetchLike
  prompt: string
  durationMs: number
  aspect: string
  imageUrl: string
}): Promise<VendorState> {
  const key = falKey(input.env)
  if (!key) return { state: "failed", message: "fal.ai is not connected. Add FAL_KEY." }
  const model = input.imageUrl ? falModel(input.env).replace("text-to-video", "image-to-video") : falModel(input.env)
  const result = await postJson(input.fetchImpl, falQueueUrl(model), { Authorization: `Key ${key}` }, klingBody(input))
  if (!result.ok) return { state: "failed", message: result.error || "The B-roll service rejected the shot." }
  const root = record(result.json)
  const id = pickString(root, ["request_id", "id"])
  if (!id) return { state: "failed", message: "The B-roll service did not return a request id." }
  const pollUrl = pickString(root, ["response_url"]) || falRequestUrl(model, id)
  const url = mediaUrl(result.json)
  if (url) return { state: "ready", id, url, pollUrl }
  return { state: "pending", id, pollUrl }
}

export async function submitMusic(env: Env, fetchImpl: FetchLike, title: string, durationMs: number): Promise<VendorState> {
  const key = falKey(env)
  if (!key) return { state: "failed", message: "Music is not connected." }
  const result = await postJson(fetchImpl, falQueueUrl(ACE_STEP_MODEL), { Authorization: `Key ${key}` }, aceStepBody({ title, durationMs }))
  if (!result.ok) return { state: "failed", message: result.error || "The music service did not answer." }
  const root = record(result.json)
  const id = pickString(root, ["request_id", "id"])
  const url = mediaUrl(result.json)
  const pollUrl = id ? falRequestUrl(ACE_STEP_MODEL, id) : ""
  if (url) return { state: "ready", id: id || "music", url, pollUrl }
  if (!id) return { state: "failed", message: "The music service did not return a track." }
  return { state: "pending", id, pollUrl }
}

export async function submitLipsync(env: Env, fetchImpl: FetchLike, shot: PlannedShot): Promise<VendorState> {
  const key = env.SYNC_API_KEY?.trim() || ""
  if (!key) return { state: "failed", message: "The lip-sync pass is not connected. Add SYNC_API_KEY." }
  const result = await postJson(fetchImpl, syncCreateUrl(), { "x-api-key": key }, syncLipsyncBody({ videoUrl: shot.outputUrl, audioUrl: shot.audioUrl }))
  if (!result.ok) return { state: "failed", message: result.error || "The lip-sync service rejected the shot." }
  const root = record(result.json)
  const id = pickString(root, ["id"])
  const url = mediaUrl(result.json)
  if (!id) return { state: "failed", message: "The lip-sync service did not return a job id." }
  const pollUrl = syncStatusUrl(id)
  if (url && doneStatus(mediaStatus(result.json))) return { state: "ready", id, url, pollUrl }
  return { state: "pending", id, pollUrl }
}

export async function pollVendor(fetchImpl: FetchLike, pollUrl: string, headers: Record<string, string>): Promise<VendorState> {
  const response = await fetchImpl(pollUrl, { headers, signal: AbortSignal.timeout(20000) }).catch(() => null)
  if (!response) return { state: "pending", id: "", pollUrl }
  const json = await readBody(response)
  if (!response.ok) {
    const parsed = readHeygenPayload(json)
    return { state: "failed", message: parsed.errorMessage || "The status check was rejected." }
  }
  const status = mediaStatus(json)
  const url = mediaUrl(json)
  const parsed = readHeygenPayload(json)
  const id = parsed.videoId
  if (failedStatus(status)) return { state: "failed", message: parsed.errorMessage || "The shot failed." }
  if (url && (doneStatus(status) || !status)) return { state: "ready", id, url, pollUrl }
  return { state: "pending", id, pollUrl }
}

export function vendorHeaders(env: Env, provider: string): Record<string, string> {
  if (provider === "heygen") return { "X-Api-Key": heygenKey(env) }
  if (provider === "grok") return { Authorization: `Bearer ${xaiKey(env)}` }
  if (provider === "fal" || provider === "music") return { Authorization: `Key ${falKey(env)}` }
  if (provider === "sync") return { "x-api-key": env.SYNC_API_KEY?.trim() || "" }
  return {}
}

export async function synthesizeSpeech(input: {
  env: Env
  fetchImpl: FetchLike
  text: string
  previousText: string
  nextText: string
  store: { putAsset(asset: { jobId: string; name: string; bytes: Uint8Array; contentType: string }): Promise<{ path: string; url: string }> }
  jobId: string
  name: string
  offsetMs: number
}) {
  const voiceId = videoVoiceId(input.env)
  const key = elevenKey(input.env)
  if (!voiceId || !key) return { ok: false as const, message: "ElevenLabs is not connected. Add ELEVENLABS_API_KEY and AVA_VOICE_CLONE_ID." }
  const result = await postJson(
    input.fetchImpl,
    elevenSpeechUrl(voiceId),
    { "xi-api-key": key },
    elevenSpeechBody({
      text: input.text,
      previousText: input.previousText,
      nextText: input.nextText,
      model: VIDEO_QUALITY_POLICY.ttsModel,
    }),
  )
  if (!result.ok) return { ok: false as const, message: result.error || "ElevenLabs did not return the voice." }
  const root = record(result.json)
  const audio = pickString(root, ["audio_base64", "audioBase64"])
  if (!audio) return { ok: false as const, message: "ElevenLabs did not return audio." }
  const stored = await input.store.putAsset({
    jobId: input.jobId,
    name: input.name,
    bytes: decodeBase64(audio),
    contentType: "audio/mpeg",
  })
  const alignment = record(root?.alignment) as ElevenAlignment | null
  return { ok: true as const, url: stored.url, path: stored.path, words: wordsFromAlignment(alignment, input.offsetMs) }
}
