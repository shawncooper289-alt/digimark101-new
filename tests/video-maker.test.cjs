const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("path")
const vm = require("node:vm")
const ts = require("typescript")

const cache = new Map()

function load(file) {
  const abs = path.resolve(file)
  if (cache.has(abs)) return cache.get(abs)
  const exports = {}
  cache.set(abs, exports)
  const code = ts.transpileModule(fs.readFileSync(abs, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const dirname = path.dirname(abs)
  function localRequire(id) {
    if (!id.startsWith(".")) throw new Error(`Unexpected import ${id}`)
    const base = path.resolve(dirname, id)
    const target = fs.existsSync(`${base}.ts`) ? `${base}.ts` : base
    return load(target)
  }
  vm.runInNewContext(code, {
    exports,
    require: localRequire,
    module: { exports },
    URL,
    AbortSignal,
    console,
  })
  return exports
}

const banned = load("lib/ava/banned-line.ts")
const video = load("lib/video/handle.ts")
const heygen = load("lib/video/heygen.ts")
const tools = {
  omitBannedLine: banned.omitBannedLine,
  spokenText: (text) => text.replace(/\bAva\b/g, "Ay-vuh"),
}
const BANNED = "In the theater of life, we are all actors sharing the same scene."

const readyEnv = {
  HEYGEN_API_KEY: "heygen-key",
  AVA_AVATAR_ID: "ava-lets-get-started",
  ELEVENLABS_API_KEY: "eleven-key",
  ELEVENLABS_VOICE_ID: "premade-bella",
  AVA_VOICE_CLONE_ID: "clone-voice",
}

function brief(extra = {}) {
  return {
    title: "Weekday mornings",
    idea: "Ava helps a bakery fill weekday mornings. Start with one clear offer.",
    audience: "bakery owners",
    offer: "a one-page plan",
    cta: "Book a call",
    seconds: 60,
    aspect: "9:16",
    style: "presenter",
    presenter: "ava",
    attire: "navy-blazer",
    ...extra,
  }
}

function passProbe(extra = {}) {
  return {
    video_id: "vid_1234",
    status: "completed",
    resolution: "1080p",
    width: 1080,
    height: 1920,
    fps: 25,
    video_duration_ms: 8000,
    audio_duration_ms: 8000,
    lip_sync_offset_ms: 10,
    black_frame_count: 0,
    frozen_seconds: 0,
    video_url: "https://cdn.example.com/finished.mp4",
    ...extra,
  }
}

test("a finished render is refused without keys and does not return a preview", async () => {
  let called = false
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief() },
    env: {},
    tools,
    fetchImpl: async () => {
      called = true
      throw new Error("should not be called")
    },
  })
  assert.equal(called, false)
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.html, undefined)
  assert.equal(result.body.videoUrl, undefined)
  assert.match(result.body.reasons.join(" "), /Pro feature/)
})

test("a preview draft is labeled and does not call a provider", async () => {
  let called = false
  const result = await video.handleVideoRequest({
    action: "preview",
    payload: { brief: brief({ idea: `Hello Ava. ${BANNED} The offer is ready.` }) },
    env: {},
    tools,
    fetchImpl: async () => {
      called = true
      throw new Error("should not be called")
    },
  })
  assert.equal(called, false)
  assert.equal(result.body.delivery, "preview-draft")
  assert.equal(result.body.delivered, false)
  assert.match(result.body.html, /PREVIEW DRAFT/)
  assert.match(result.body.fileName, /preview-draft/)
  assert.equal(result.body.html.includes(BANNED), false)
  assert.match(result.body.project.script, /Ava/)
  assert.equal(result.body.project.script.includes("Ay-vuh"), false)
})

test("quality overrides are ignored and the HeyGen job stays premium", async () => {
  const prepared = await video.handleVideoRequest({
    action: "prepare",
    payload: { brief: brief({ quality: "720p", resolution: "480p", fps: 15, model: "eleven_turbo_v2_5" }) },
    env: readyEnv,
    tools,
  })
  assert.deepEqual(
    [...prepared.body.project.ignoredOverrides].map(String).sort(),
    ["fps", "model", "quality", "resolution"],
  )
  const project = load("lib/video/prepare.ts").prepareProject(brief(), readyEnv, tools).project
  const body = heygen.heygenBody(project, "4k")
  assert.equal(body.resolution, "4k")
  assert.equal(body.type, "studio")
  assert.equal(body.scenes.length > 1, true)
  const avatar = body.scenes[0].input.avatar_id
  const voice = body.scenes[0].input.voice_id
  assert.equal(voice, "clone-voice")
  assert.equal(voice.includes("premade-bella"), false)
  for (const scene of body.scenes) {
    assert.equal(scene.input.avatar_id, avatar)
    assert.equal(scene.input.voice_id, voice)
    assert.equal(scene.input.engine.type, "avatar_v")
    assert.equal(scene.input.voice_settings.engine_settings.model, "eleven_v4")
    assert.match(scene.input.motion_prompt, /Dissolve|Fade in/)
    assert.equal(/freeze/i.test(scene.input.motion_prompt), false)
  }
  assert.equal(JSON.stringify(body).includes("720"), false)
  assert.equal(project.scenes.every((scene) => scene.lighting === project.lighting), true)
})

test("a confirmed premium file can be delivered", async () => {
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief() },
    env: readyEnv,
    tools,
    fetchImpl: async () => new Response(JSON.stringify(passProbe()), { status: 200 }),
  })
  assert.equal(result.body.delivery, "final")
  assert.equal(result.body.delivered, true)
  assert.equal(result.body.videoUrl, "https://cdn.example.com/finished.mp4")
})

test("missing lip-sync timing blocks delivery and does not return the file", async () => {
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief() },
    env: readyEnv,
    tools,
    fetchImpl: async () => new Response(JSON.stringify(passProbe({ lip_sync_offset_ms: null })), { status: 200 }),
  })
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.videoUrl, undefined)
  assert.match(result.body.reasons.join(" "), /Lip-sync/)
})

test("a below-1080 file is not delivered", async () => {
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief() },
    env: readyEnv,
    tools,
    fetchImpl: async () => new Response(JSON.stringify(passProbe({ resolution: "720p", width: 720, height: 1280 })), { status: 200 }),
  })
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.videoUrl, undefined)
  assert.match(result.body.reasons.join(" "), /1080p/)
})

test("a failed duration check starts another render instead of delivering", async () => {
  const calls = []
  const result = await video.handleVideoRequest({
    action: "status",
    payload: { brief: brief(), videoId: "vid_1234", provider: "heygen", attempt: 1 },
    env: readyEnv,
    tools,
    fetchImpl: async (url, init) => {
      calls.push({ url, method: init?.method || "GET" })
      if ((init?.method || "GET") === "GET") {
        return new Response(JSON.stringify(passProbe({
          video_duration_ms: 8000,
          audio_duration_ms: 12000,
        })), { status: 200 })
      }
      return new Response(JSON.stringify({ video_id: "vid_5678", status: "waiting" }), { status: 200 })
    },
  })
  assert.equal(result.body.delivery, "rendering")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.videoUrl, undefined)
  assert.equal(result.body.videoId, "vid_5678")
  assert.equal(result.body.attempt, 2)
  assert.equal(calls.length, 2)
  assert.match(result.body.note, /not delivered/)
})

test("a long brief stays one face and one voice across scenes", () => {
  const idea = Array.from({ length: 18 }, (_, index) => `Point ${index + 1} is a short spoken line about the bakery offer.`).join(" ")
  const project = load("lib/video/prepare.ts").prepareProject(brief({ idea, seconds: 180 }), readyEnv, tools).project
  assert.equal(project.scenes.length > 8, true)
  assert.ok(project.spokenSeconds > 40)
  assert.equal(new Set(project.scenes.map((scene) => scene.avatarId)).size, 1)
  assert.equal(new Set(project.scenes.map((scene) => scene.voiceId)).size, 1)
  assert.equal(new Set(project.scenes.map((scene) => scene.lighting)).size, 1)
  assert.equal(project.voiceId, "clone-voice")
})

test("schedule copy tells the truth about a preview", async () => {
  const result = await video.handleVideoRequest({
    action: "handoff",
    payload: { brief: brief(), delivery: "preview-draft", platform: "tiktok" },
    env: {},
    tools,
  })
  assert.match(result.body.caption, /PREVIEW DRAFT/)
  assert.match(result.body.caption, /not a finished video/)
  assert.equal(result.body.posted, undefined)
})
