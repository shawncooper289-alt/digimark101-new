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
const identity = load("lib/ava/identity.ts")
const officeIdentity = load("avaskye-online/src/lib/ava/identity.ts")
const mainImports = { "@/lib/ava/speech": speech, "@/lib/ava/identity": identity }
const officeImports = { "@/lib/ava/identity": officeIdentity }

test("server voice defaults to coral on gpt-4o-mini-tts and keeps the long-A name", () => {
  const { ttsPlan, DEFAULT_TTS_VOICE, DEFAULT_TTS_MODEL, DEFAULT_TTS_INSTRUCTIONS } = load("lib/ava/tts.ts", mainImports)
  assert.equal(DEFAULT_TTS_MODEL, "gpt-4o-mini-tts")
  assert.equal(DEFAULT_TTS_VOICE, "coral")
  const plan = ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key" })
  const body = JSON.parse(plan.body)
  assert.equal(plan.provider, "openai")
  assert.equal(plan.url, "https://api.openai.com/v1/audio/speech")
  assert.equal(body.model, "gpt-4o-mini-tts")
  assert.equal(body.voice, "coral")
  assert.equal(body.input, "Hello Ay-vuh")
  assert.equal(body.instructions, DEFAULT_TTS_INSTRUCTIONS)
  assert.match(body.instructions, /warm, confident young-adult woman/)
  assert.match(body.instructions, /General American/)
  assert.match(body.instructions, /pronounced AY-vuh, with a strong long A \(as in able or day\), never AH-vuh, AW-vuh, Awva, or Ah-va/)
  assert.equal(plan.headers.Authorization, "Bearer server-key")
})

test("an instructions override cannot drop the long-A name", () => {
  const { ttsPlan, DEFAULT_TTS_INSTRUCTIONS, AVA_NAME_PRONUNCIATION_RULE } = load("lib/ava/tts.ts", mainImports)
  const overridden = JSON.parse(
    ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key", AVA_TTS_INSTRUCTIONS: "Speak more quickly." }).body,
  )
  assert.equal(overridden.voice, "coral")
  assert.equal(overridden.instructions, `Speak more quickly. ${AVA_NAME_PRONUNCIATION_RULE}`)
  const blank = JSON.parse(ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key", AVA_TTS_INSTRUCTIONS: "   " }).body)
  assert.equal(blank.instructions, DEFAULT_TTS_INSTRUCTIONS)
  const already = JSON.parse(
    ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key", AVA_TTS_INSTRUCTIONS: DEFAULT_TTS_INSTRUCTIONS }).body,
  )
  assert.equal(already.instructions, DEFAULT_TTS_INSTRUCTIONS)
})

test("elevenlabs is preferred when its key and voice are set", () => {
  const { ttsPlan } = load("lib/ava/tts.ts", mainImports)
  const plan = ttsPlan("Hello Ava", {
    ELEVENLABS_API_KEY: "eleven-key",
    ELEVENLABS_VOICE_ID: "voice-1",
    AVA_TTS_API_KEY: "server-key",
    AVA_TTS_INSTRUCTIONS: "Speak more quickly.",
  })
  const body = JSON.parse(plan.body)
  assert.equal(plan.provider, "elevenlabs")
  assert.match(plan.url, /voice-1/)
  assert.equal(plan.headers["xi-api-key"], "eleven-key")
  assert.equal(body.text, "Hello Ay-vuh")
  assert.equal(body.instructions, undefined)
  assert.equal(body.model_id, "eleven_multilingual_v2")
})

test("older tts-1 requests omit instructions the model would reject", () => {
  const { ttsPlan } = load("lib/ava/tts.ts", mainImports)
  const body = JSON.parse(
    ttsPlan("Hello", { AVA_TTS_API_KEY: "server-key", AVA_TTS_MODEL: "tts-1", AVA_TTS_INSTRUCTIONS: "Speak more quickly." }).body,
  )
  assert.equal(body.model, "tts-1")
  assert.equal(body.instructions, undefined)
})

test("office voice uses the same defaults and pronounces Ay-vuh", () => {
  const { ttsPlan, DEFAULT_TTS_INSTRUCTIONS, AVA_NAME_PRONUNCIATION_RULE } = load(
    "avaskye-online/src/lib/ava-tts.ts",
    officeImports,
  )
  const plan = ttsPlan("Ava here", { AVA_TTS_API_KEY: "server-key" })
  const body = JSON.parse(plan.body)
  assert.equal(body.voice, "coral")
  assert.equal(body.model, "gpt-4o-mini-tts")
  assert.equal(body.input, "Ay-vuh here")
  assert.equal(body.instructions, DEFAULT_TTS_INSTRUCTIONS)
  assert.match(body.instructions, /moderate, conversational pace/)
  assert.match(body.instructions, /strong long A/)
  const overridden = JSON.parse(
    ttsPlan("Ava here", { AVA_TTS_API_KEY: "server-key", AVA_TTS_INSTRUCTIONS: "Speak more quickly." }).body,
  )
  assert.equal(overridden.voice, "coral")
  assert.equal(overridden.instructions, `Speak more quickly. ${AVA_NAME_PRONUNCIATION_RULE}`)
  assert.equal(overridden.input, "Ay-vuh here")
})
