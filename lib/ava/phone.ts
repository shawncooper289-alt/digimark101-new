import { createHmac, timingSafeEqual } from "node:crypto"

/**
 * Phone calls go through an ElevenLabs agent on a Twilio number.
 * Nothing is dialed unless the owner is signed in, the person agreed,
 * and the number is on AVA_CALL_ALLOWLIST.
 */

export const PHONE_NOT_CONNECTED = {
  success: true as const,
  channel: "browser" as const,
  note: "Voice uses this browser's speech APIs. Phone calling is not connected.",
}

const E164 = /^\+[1-9]\d{7,14}$/
const TWILIO_CALL = /^CA[0-9a-fA-F]{32}$/
const TWILIO_ACCOUNT = /^AC[0-9a-fA-F]{32}$/

type Env = Record<string, string | undefined>

export function normalizeE164(value: unknown) {
  if (typeof value !== "string") return ""
  const compact = value.trim().replace(/[\s().-]/g, "")
  return E164.test(compact) ? compact : ""
}

export function phoneCallingEnv(env: Env) {
  const apiKey = env.ELEVENLABS_API_KEY?.trim() || ""
  const agentId = env.ELEVENLABS_AGENT_ID?.trim() || ""
  const phoneNumberId = env.ELEVENLABS_AGENT_PHONE_NUMBER_ID?.trim() || ""
  if (!apiKey || !agentId || !phoneNumberId) return null
  return { apiKey, agentId, phoneNumberId }
}

export function callAllowlist(env: Env) {
  return (env.AVA_CALL_ALLOWLIST || "")
    .split(/[,;\s]+/)
    .map((item) => normalizeE164(item))
    .filter(Boolean)
}

export function twilioEnv(env: Env) {
  const sid = env.TWILIO_ACCOUNT_SID?.trim() || ""
  const token = env.TWILIO_AUTH_TOKEN?.trim() || ""
  if (!TWILIO_ACCOUNT.test(sid) || !token) return null
  return { sid, token }
}

export type OutboundDecision =
  | { ok: true; kind: "unconfigured"; body: typeof PHONE_NOT_CONNECTED }
  | { ok: true; kind: "dial"; to: string; agentId: string; phoneNumberId: string; apiKey: string }
  | { ok: false; status: number; body: { error: string } }

export function decideOutboundCall(input: { env: Env; owner: boolean; body: unknown }): OutboundDecision {
  const config = phoneCallingEnv(input.env)
  if (!config) return { ok: true, kind: "unconfigured", body: PHONE_NOT_CONNECTED }
  if (!input.owner) {
    return { ok: false, status: 403, body: { error: "Only the owner can place a phone call." } }
  }
  const record = input.body && typeof input.body === "object" ? (input.body as Record<string, unknown>) : {}
  if (record.consent !== true) {
    return { ok: false, status: 400, body: { error: "Confirm that this person agreed to be called before Ava dials." } }
  }
  const to = normalizeE164(record.to)
  if (!to) {
    return { ok: false, status: 400, body: { error: "Enter a phone number with the country code, like +15551234567." } }
  }
  const allowed = callAllowlist(input.env)
  if (!allowed.length) {
    return {
      ok: false,
      status: 503,
      body: { error: "Add the numbers Ava may call to AVA_CALL_ALLOWLIST. She will not dial a number that is not on that list." },
    }
  }
  if (!allowed.includes(to)) {
    return { ok: false, status: 403, body: { error: "That number is not on the call list. Ava will not dial it." } }
  }
  return { ok: true, kind: "dial", to, ...config }
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

export async function placeOutboundCall(
  dial: { apiKey: string; agentId: string; phoneNumberId: string; to: string },
  fetchImpl: FetchLike = fetch,
) {
  try {
    const response = await fetchImpl("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: "POST",
      headers: { "xi-api-key": dial.apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        agent_id: dial.agentId,
        agent_phone_number_id: dial.phoneNumberId,
        to_number: dial.to,
      }),
    })
    const data = (await response.json().catch(() => null)) as { success?: unknown; callSid?: unknown; conversation_id?: unknown; message?: unknown } | null
    if (!response.ok || data?.success === false) {
      return { ok: false as const, error: "The phone line did not start the call. Nothing was logged as completed." }
    }
    const callSid = typeof data?.callSid === "string" ? data.callSid : ""
    const conversationId = typeof data?.conversation_id === "string" ? data.conversation_id : ""
    if (!callSid && !conversationId) {
      return { ok: false as const, error: "The phone line did not return a call id. The call was not recorded as started." }
    }
    return { ok: true as const, callSid, conversationId }
  } catch {
    return { ok: false as const, error: "The phone line could not be reached. No call was placed." }
  }
}

export function decideEndCall(input: { env: Env; owner: boolean; callSid: unknown }) {
  const connected = Boolean(phoneCallingEnv(input.env))
  if (!connected) return { ok: true as const, kind: "unconfigured" as const, body: { success: true, channel: "browser" } }
  if (!input.owner) return { ok: false as const, status: 403, body: { error: "Only the owner can end a phone call from the site." } }
  const twilio = twilioEnv(input.env)
  if (!twilio) {
    return {
      ok: false as const,
      status: 503,
      body: { error: "Hang-up from the site needs TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN. The person on the phone can still hang up." },
    }
  }
  const callSid = typeof input.callSid === "string" ? input.callSid.trim() : ""
  if (!TWILIO_CALL.test(callSid)) {
    return { ok: false as const, status: 400, body: { error: "That call id is not a Twilio call." } }
  }
  return { ok: true as const, kind: "hangup" as const, callSid, ...twilio }
}

export async function hangUpCall(input: { sid: string; token: string; callSid: string }, fetchImpl: FetchLike = fetch) {
  const auth = Buffer.from(`${input.sid}:${input.token}`).toString("base64")
  try {
    const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${input.sid}/Calls/${input.callSid}.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ Status: "completed" }).toString(),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return { ok: false as const, error: "Twilio did not end the call." }
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Twilio could not be reached. The call was not ended from the site." }
  }
}

export function secretsMatch(provided: string | null, expected: string) {
  if (!expected || !provided) return false
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function readElevenLabsEvent(raw: string, header: string | null, secret: string, now = Date.now()) {
  if (!secret) return { ok: false as const, error: "Phone calling is not connected." }
  if (!header) return { ok: false as const, error: "Missing signature." }
  const parts = header.split(",").map((part) => part.trim())
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2)
  const signature = parts.find((part) => part.startsWith("v0="))?.slice(3)
  if (!timestamp || !signature) return { ok: false as const, error: "Missing signature." }
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(now - seconds * 1000) > 30 * 60 * 1000) {
    return { ok: false as const, error: "Signature expired." }
  }
  const digest = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")
  const left = Buffer.from(signature)
  const right = Buffer.from(digest)
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false as const, error: "Invalid signature." }
  }
  try {
    return { ok: true as const, event: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false as const, error: "Invalid signature." }
  }
}

export function signElevenLabsBody(raw: string, secret: string, now = Date.now()) {
  const timestamp = String(Math.floor(now / 1000))
  const digest = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")
  return `t=${timestamp},v0=${digest}`
}

export type CallFacts = { ids: string[]; duration: number | null; phone: string }

export function callFacts(event: unknown): CallFacts {
  const found: CallFacts = { ids: [], duration: null, phone: "" }
  walk(event, found, 0)
  found.ids = [...new Set(found.ids)]
  return found
}

function walk(value: unknown, found: CallFacts, depth: number) {
  if (!value || depth > 6 || typeof value !== "object") return
  if (Array.isArray(value)) {
    for (const item of value.slice(0, 30)) walk(item, found, depth + 1)
    return
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === "full_audio" || key === "transcript") continue
    const name = key.toLowerCase()
    if ((name === "call_sid" || name === "callsid" || name === "conversation_id") && typeof item === "string" && item.length > 4 && item.length < 80) {
      found.ids.push(item)
    }
    if (name === "call_duration_secs" && typeof item === "number" && item >= 0 && item < 24 * 60 * 60) {
      found.duration = Math.round(item)
    }
    if ((name === "caller_id" || name === "to_number" || name === "called" || name === "phone_number") && typeof item === "string" && item.startsWith("+")) {
      found.phone = item.slice(0, 20)
    }
    if (item && typeof item === "object") walk(item, found, depth + 1)
  }
}

/** The log stores the ElevenLabs conversation id when we have one, because the completion webhook sends that id. */
export function logId(callSid: string, conversationId: string) {
  return (conversationId || callSid).slice(0, 80)
}
