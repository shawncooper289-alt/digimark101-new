const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (id) => imports[id], ...globals })
  return exports
}

const speech = {
  spokenText: (text) => text.replace(/\bAva\b/g, "Ay-vuh"),
}

test("server voice defaults to coral on gpt-4o-mini-tts and keeps the long-A name", () => {
  const { ttsPlan, DEFAULT_TTS_VOICE, DEFAULT_TTS_MODEL } = load("lib/ava/tts.ts", { "@/lib/ava/speech": speech })
  assert.equal(DEFAULT_TTS_MODEL, "gpt-4o-mini-tts")
  assert.equal(DEFAULT_TTS_VOICE, "coral")
  const plan = ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key" })
  const body = JSON.parse(plan.body)
  assert.equal(plan.provider, "openai")
  assert.equal(plan.url, "https://api.openai.com/v1/audio/speech")
  assert.equal(body.model, "gpt-4o-mini-tts")
  assert.equal(body.voice, "coral")
  assert.equal(body.input, "Hello Ay-vuh")
  assert.match(body.instructions, /General American/)
  assert.equal(plan.headers.Authorization, "Bearer server-key")
})

test("elevenlabs is preferred when its key and voice are set", () => {
  const { ttsPlan } = load("lib/ava/tts.ts", { "@/lib/ava/speech": speech })
  const plan = ttsPlan("Hello Ava", {
    ELEVENLABS_API_KEY: "eleven-key",
    ELEVENLABS_VOICE_ID: "voice-1",
    AVA_TTS_API_KEY: "server-key",
  })
  assert.equal(plan.provider, "elevenlabs")
  assert.match(plan.url, /voice-1/)
  assert.equal(plan.headers["xi-api-key"], "eleven-key")
  assert.equal(JSON.parse(plan.body).text, "Hello Ay-vuh")
})

test("older tts-1 requests omit instructions the model would reject", () => {
  const { ttsPlan } = load("lib/ava/tts.ts", { "@/lib/ava/speech": speech })
  const body = JSON.parse(ttsPlan("Hello", { AVA_TTS_API_KEY: "server-key", AVA_TTS_MODEL: "tts-1" }).body)
  assert.equal(body.model, "tts-1")
  assert.equal(body.instructions, undefined)
})

test("office voice uses the same defaults and pronounces Ay-vuh", () => {
  const { ttsPlan } = load("avaskye-online/src/lib/ava-tts.ts")
  const plan = ttsPlan("Ava here", { AVA_TTS_API_KEY: "server-key" })
  const body = JSON.parse(plan.body)
  assert.equal(body.voice, "coral")
  assert.equal(body.input, "Ay-vuh here")
  assert.match(body.instructions, /moderate, conversational pace/)
})
