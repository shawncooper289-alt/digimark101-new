const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require: (id) => {
      if (id === "node:crypto") return require("node:crypto")
      if (imports[id]) return imports[id]
      throw new Error(`unexpected import ${id}`)
    },
    process,
    console,
    Buffer,
    URL,
    URLSearchParams,
    AbortSignal,
    fetch,
    setTimeout,
    clearTimeout,
    TextEncoder,
    TextDecoder,
    crypto,
  })
  return exports
}

const http = load("lib/http.ts")
const phone = load("lib/ava/phone.ts")

const savedUpstashUrl = process.env.UPSTASH_REDIS_REST_URL
const savedUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

function restoreUpstash() {
  if (savedUpstashUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL
  else process.env.UPSTASH_REDIS_REST_URL = savedUpstashUrl
  if (savedUpstashToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
  else process.env.UPSTASH_REDIS_REST_TOKEN = savedUpstashToken
}

test("the memory limiter blocks the next request and then opens a new window", async () => {
  http.resetRateLimitsForTests()
  assert.equal(await http.tooManyRequests("chat", 1, 1000, { env: {}, now: 5000 }), false)
  assert.equal(await http.tooManyRequests("chat", 1, 1000, { env: {}, now: 5000 }), true)
  assert.equal(await http.tooManyRequests("other", 1, 1000, { env: {}, now: 5000 }), false)
  assert.equal(await http.tooManyRequests("chat", 1, 1000, { env: {}, now: 7000 }), false)
})

test("Upstash counts shared requests and a Redis miss falls back to memory", async () => {
  http.resetRateLimitsForTests()
  const env = { UPSTASH_REDIS_REST_URL: "https://example.upstash.io", UPSTASH_REDIS_REST_TOKEN: "token" }
  let seen = 0
  const fetchImpl = async (url, init) => {
    assert.equal(url, "https://example.upstash.io/pipeline")
    assert.equal(init.headers.Authorization, "Bearer token")
    const body = JSON.parse(init.body)
    assert.equal(body[0][0], "INCR")
    assert.match(body[0][1], /^dm:rl:chat/)
    seen += 1
    return { ok: true, json: async () => [{ result: seen }, { result: 1 }] }
  }
  assert.equal(await http.tooManyRequests("chat", 2, 60_000, { env, fetchImpl, now: 1 }), false)
  assert.equal(await http.tooManyRequests("chat", 2, 60_000, { env, fetchImpl, now: 1 }), false)
  assert.equal(await http.tooManyRequests("chat", 2, 60_000, { env, fetchImpl, now: 1 }), true)

  http.resetRateLimitsForTests()
  const down = async () => {
    throw new Error("redis down")
  }
  assert.equal(await http.tooManyRequests("mem", 1, 60_000, { env, fetchImpl: down, now: 10 }), false)
  assert.equal(await http.tooManyRequests("mem", 1, 60_000, { env, fetchImpl: down, now: 10 }), true)
})

test("a public request cannot dial, and a missing line keeps today's message", () => {
  const quiet = phone.decideOutboundCall({
    env: {},
    owner: false,
    body: { to: "+15551234567", consent: true },
  })
  assert.equal(quiet.ok, true)
  assert.equal(quiet.kind, "unconfigured")
  assert.match(quiet.body.note, /Phone calling is not connected/)

  const env = {
    ELEVENLABS_API_KEY: "eleven",
    ELEVENLABS_AGENT_ID: "agent",
    ELEVENLABS_AGENT_PHONE_NUMBER_ID: "phnum",
    AVA_CALL_ALLOWLIST: "+15551234567",
  }
  const stranger = phone.decideOutboundCall({ env, owner: false, body: { to: "+15551234567", consent: true } })
  assert.equal(stranger.ok, false)
  assert.equal(stranger.status, 403)
  const noConsent = phone.decideOutboundCall({ env, owner: true, body: { to: "+15551234567", consent: "true" } })
  assert.equal(noConsent.status, 400)
  const offList = phone.decideOutboundCall({ env, owner: true, body: { to: "+15557654321", consent: true } })
  assert.equal(offList.status, 403)
  const ready = phone.decideOutboundCall({ env, owner: true, body: { to: "+1 (555) 123-4567", consent: true } })
  assert.equal(ready.ok, true)
  assert.equal(ready.kind, "dial")
  assert.equal(ready.to, "+15551234567")
  assert.equal(JSON.stringify(ready).includes("eleven"), true)
})

test("the call route refuses an unauthenticated dial and places an allowlisted owner call", async () => {
  http.resetRateLimitsForTests()
  const placed = []
  const originalFetch = global.fetch
  global.fetch = async (url, init) => {
    placed.push({ url: String(url), body: JSON.parse(init.body) })
    return {
      ok: true,
      json: async () => ({ success: true, callSid: `CA${"a".repeat(32)}`, conversation_id: "conv_test" }),
    }
  }
  const phoneForRoute = load("lib/ava/phone.ts")
  let current = { user: null }
  const route = load("app/api/ava/initiate-call/route.ts", {
    "next/server": { NextResponse: { json: (data, options) => Response.json(data, options) } },
    "@/lib/ava/phone": phoneForRoute,
    "@/lib/http": http,
    "@/lib/owner/access": { isOwnerIdentity: (user) => Boolean(user?.owner) },
    "@/lib/supabase/admin": { createSupabaseAdmin: () => null },
    "@/lib/supabase/server": { currentUser: async () => current },
  })
  const env = {
    ELEVENLABS_API_KEY: "eleven-secret",
    ELEVENLABS_AGENT_ID: "agent-1",
    ELEVENLABS_AGENT_PHONE_NUMBER_ID: "phnum-1",
    AVA_CALL_ALLOWLIST: "+15551234567",
  }
  const previous = {}
  for (const key of Object.keys(env)) {
    previous[key] = process.env[key]
    process.env[key] = env[key]
  }
  try {
    const request = (body) =>
      new Request("https://www.digimark101.com/api/ava/initiate-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
    const blocked = await route.POST(request({ to: "+15551234567", consent: true }))
    assert.equal(blocked.status, 403)
    assert.equal(placed.length, 0)
    const payload = await blocked.json()
    assert.match(payload.error, /owner/)
    assert.equal(JSON.stringify(payload).includes("eleven-secret"), false)

    current = { user: { id: "owner-1", owner: true } }
    const started = await route.POST(request({ to: "+15551234567", consent: true }))
    assert.equal(started.status, 200)
    const startedBody = await started.json()
    assert.equal(startedBody.channel, "phone")
    assert.equal(startedBody.conversationId, "conv_test")
    assert.equal(placed.length, 1)
    assert.equal(placed[0].url, "https://api.elevenlabs.io/v1/convai/twilio/outbound-call")
    assert.equal(placed[0].body.to_number, "+15551234567")
    assert.equal(placed[0].body.agent_id, "agent-1")
    assert.deepEqual(placed[0].body.conversation_initiation_client_data, {})
  } finally {
    global.fetch = originalFetch
    for (const key of Object.keys(env)) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
    restoreUpstash()
  }
})

test("ElevenLabs webhook signatures reject a bad or old header", () => {
  const raw = JSON.stringify({
    type: "post_call_transcription",
    data: { conversation_id: "conv_test", metadata: { call_duration_secs: 22, caller_id: "+15551234567" } },
  })
  const now = Date.now()
  const header = phone.signElevenLabsBody(raw, "whsec", now)
  const good = phone.readElevenLabsEvent(raw, header, "whsec", now)
  assert.equal(good.ok, true)
  const facts = phone.callFacts(good.event)
  assert.equal(facts.ids.length, 1)
  assert.equal(facts.ids[0], "conv_test")
  assert.equal(facts.duration, 22)
  assert.equal(facts.phone, "+15551234567")
  assert.equal(phone.readElevenLabsEvent(raw, header, "other", now).ok, false)
  assert.equal(phone.readElevenLabsEvent(raw, header, "whsec", now + 31 * 60 * 1000).ok, false)
  assert.equal(phone.readElevenLabsEvent(raw, null, "").error, "Phone calling is not connected.")
})

test.after(restoreUpstash)
