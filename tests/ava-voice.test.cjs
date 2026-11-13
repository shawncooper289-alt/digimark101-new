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
const banned = load("lib/ava/banned-line.ts")
const officeBanned = load("avaskye-online/src/lib/ava/banned-line.ts")
const mainImports = { "@/lib/ava/speech": speech, "@/lib/ava/identity": identity, "@/lib/ava/banned-line": banned }
const officeImports = { "@/lib/ava/identity": officeIdentity, "@/lib/ava/banned-line": officeBanned }
const BANNED = "In the theater of life, we are all actors sharing the same scene."

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
  assert.match(body.instructions, /theater of life/)
  assert.match(body.instructions, /we-are-all-actors/)
  assert.equal(plan.headers.Authorization, "Bearer server-key")
})

test("an instructions override cannot drop the long-A name", () => {
  const { ttsPlan, DEFAULT_TTS_INSTRUCTIONS, AVA_NAME_PRONUNCIATION_RULE, AVA_BANNED_LINE_RULE } = load("lib/ava/tts.ts", mainImports)
  const overridden = JSON.parse(
    ttsPlan("Hello Ava", { AVA_TTS_API_KEY: "server-key", AVA_TTS_INSTRUCTIONS: "Speak more quickly." }).body,
  )
  assert.equal(overridden.voice, "coral")
  assert.equal(overridden.instructions, `Speak more quickly. ${AVA_NAME_PRONUNCIATION_RULE} ${AVA_BANNED_LINE_RULE}`)
  assert.match(overridden.instructions, /pronounced AY-vuh, with a strong long A/)
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

test("the voice clone id replaces the premade voice on both sites", () => {
  const main = load("lib/ava/tts.ts", mainImports)
  const office = load("avaskye-online/src/lib/ava-tts.ts", officeImports)
  for (const { ttsPlan } of [main, office]) {
    const plan = ttsPlan("Hello Ava", {
      ELEVENLABS_API_KEY: "eleven-key",
      ELEVENLABS_VOICE_ID: "premade-bella",
      AVA_VOICE_CLONE_ID: "clone-from-env",
    })
    assert.match(plan.url, /clone-from-env/)
    assert.equal(plan.url.includes("premade-bella"), false)
    assert.equal(plan.url.includes("hpp4J3VqNfWAUOO0d1Us"), false)
  }
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
  assert.equal(overridden.instructions, `Speak more quickly. ${AVA_NAME_PRONUNCIATION_RULE} ${banned.BANNED_LINE_RULE}`)
  assert.match(overridden.instructions, /strong long A/)
  assert.equal(overridden.input, "Ay-vuh here")
})

test("speech never includes the preview sentence, on either site", () => {
  const main = load("lib/ava/tts.ts", mainImports)
  const office = load("avaskye-online/src/lib/ava-tts.ts", officeImports)
  const { omitBannedLine, FALLBACK_GREETING } = banned
  assert.equal(omitBannedLine(BANNED), FALLBACK_GREETING)
  assert.equal(omitBannedLine(`"${BANNED}"`), FALLBACK_GREETING)
  assert.equal(omitBannedLine(BANNED.toUpperCase()), FALLBACK_GREETING)
  assert.equal(omitBannedLine("In the theatre of life, we're all actors sharing the same scene."), FALLBACK_GREETING)
  assert.equal(omitBannedLine("We're all actors sharing the same scene."), FALLBACK_GREETING)
  assert.equal(omitBannedLine("On the stage of life, we are all actors."), FALLBACK_GREETING)
  assert.equal(
    omitBannedLine(`Hello Ava. ${BANNED} Your page is ready.`),
    "Hello Ava. Your page is ready.",
  )
  assert.equal(
    omitBannedLine("The downtown theater is hiring actors for a spring commercial."),
    "The downtown theater is hiring actors for a spring commercial.",
  )
  assert.equal(
    omitBannedLine("At this stage of life, buyers compare prices."),
    "At this stage of life, buyers compare prices.",
  )
  assert.doesNotMatch(FALLBACK_GREETING, /theater|theatre|actors|scene/i)

  for (const { ttsPlan } of [main, office]) {
    const openai = JSON.parse(ttsPlan(`Hello Ava. ${BANNED} The draft is ready.`, { AVA_TTS_API_KEY: "server-key" }).body)
    assert.equal(openai.input, "Hello Ay-vuh. The draft is ready.")
    assert.equal(openai.voice, "coral")
    assert.doesNotMatch(openai.input, /theater of life/i)
    const only = JSON.parse(ttsPlan(BANNED, {
      ELEVENLABS_API_KEY: "eleven-key",
      ELEVENLABS_VOICE_ID: "voice-from-env",
    }).body)
    assert.equal(only.text, FALLBACK_GREETING)
    assert.doesNotMatch(only.text, /theater of life|we are all actors/i)
    assert.equal(ttsPlan("Hello", { AVA_TTS_API_KEY: "server-key" }).provider, "openai")
  }

  const eleven = main.ttsPlan("Hello Ava", {
    ELEVENLABS_API_KEY: "eleven-key",
    ELEVENLABS_VOICE_ID: "voice-from-env",
  })
  assert.match(eleven.url, /voice-from-env/)
  assert.equal(eleven.url.includes("hpp4J3VqNfWAUOO0d1Us"), false)
})

test("prompts keep the preview-sentence ban and do not hardcode a voice id", () => {
  assert.equal(fs.readFileSync("lib/ava/banned-line.ts", "utf8"), fs.readFileSync("avaskye-online/src/lib/ava/banned-line.ts", "utf8"))
  const files = [
    "lib/ava/respond.ts",
    "lib/ava/knowledge-base.ts",
    "lib/ava/tts.ts",
    "avaskye-online/src/app/api/office/guide/route.ts",
    "avaskye-online/src/lib/ava/knowledge-base.ts",
    "avaskye-online/src/lib/ava-tts.ts",
  ]
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8")
    assert.match(source, /BANNED_LINE_RULE/)
    assert.equal(source.includes("hpp4J3VqNfWAUOO0d1Us"), false)
  }
  const intro = fs.readFileSync("lib/ava/intro.ts", "utf8")
  assert.match(intro, /omitBannedLine/)
  assert.match(intro, /dynasty gets built/)
  assert.equal(intro.includes(BANNED), false)
})
