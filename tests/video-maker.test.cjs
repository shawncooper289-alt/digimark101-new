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
const grok = load("lib/video/grok.ts")
const cost = load("lib/video/cost.ts")
const gate = load("lib/video/gate.ts")
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

function providerFetch(log) {
  let n = 0
  return async (url, init) => {
    const target = String(url)
    const method = init?.method || "GET"
    const body = init?.body ? JSON.parse(init.body) : null
    log.push({ url: target, method, body })
    if (target.includes("api.openai.com")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify({ title: "Weekday mornings", script: "Ava helps the bakery fill quiet mornings. Book a call when you are ready.", shots: [] }) } }] })
    }
    if (target.includes("elevenlabs.io")) {
      return jsonResponse({
        audio_base64: "QQ==",
        alignment: {
          characters: ["A", "y", "a"],
          character_start_times_seconds: [0, 0.1, 0.2],
          character_end_times_seconds: [0.1, 0.2, 0.3],
        },
      })
    }
    if (target.includes("/v3/avatars/looks/")) {
      return jsonResponse({ supported_api_engines: ["heygen-avatar-6-turbo", "avatar_v"] })
    }
    if (target.includes("api.heygen.com/v3/videos") && method === "POST") {
      n += 1
      return jsonResponse({ data: { video_id: `vid_${n}`, status: "pending" } })
    }
    if (target.includes("api.heygen.com/v3/videos/")) {
      return jsonResponse({ data: { id: "vid_done", status: "completed", video_url: "https://cdn.example.com/ava.mp4" } })
    }
    if (target.includes("/v1/videos/generations")) {
      n += 1
      return jsonResponse({ request_id: `grok_${n}` })
    }
    if (target.includes("api.x.ai/v1/videos/")) {
      return jsonResponse({ status: "done", video: { url: "https://cdn.example.com/broll.mp4", duration: 8 } })
    }
    if (target.includes("ace-step") && method === "POST") {
      return jsonResponse({ request_id: "music_1" })
    }
    if (target.includes("ace-step")) {
      return jsonResponse({ status: "COMPLETED", audio: { url: "https://cdn.example.com/music.mp3" } })
    }
    if (target.includes("api.sync.so") && method === "POST") {
      return jsonResponse({ id: "sync_1", status: "PENDING" })
    }
    if (target.includes("api.sync.so")) {
      return jsonResponse({ id: "sync_1", status: "COMPLETED", outputUrl: "https://cdn.example.com/synced.mp4" })
    }
    if (target.includes("queue.fal.run") && method === "POST") {
      n += 1
      return jsonResponse({ request_id: `fal_${n}` })
    }
    if (target.includes("queue.fal.run")) {
      return jsonResponse({ status: "COMPLETED", video: { url: "https://cdn.example.com/fal.mp4" } })
    }
    throw new Error(`unexpected ${method} ${target}`)
  }
}

test("a finished render is refused without keys and does not return a preview", async () => {
  let called = false
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief() },
    env: {},
    tools,
    store: video.memoryVideoStore(),
    editorReady: async () => ({ ok: true }),
    render: async () => ({ url: "https://cdn.example.com/nope.mp4", width: 1080, height: 1920, fps: 30, videoDurationMs: 1000, audioDurationMs: 1000 }),
    fetchImpl: async () => {
      called = true
      throw new Error("should not be called")
    },
  })
  assert.equal(called, false)
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.html, undefined)
  assert.equal(result.body.videoUrl, "")
  assert.match(result.body.reasons.join(" "), /Nothing was rendered/)
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
  const body = heygen.heygenAvatarRequest({
    title: project.title,
    avatarId: project.avatarId,
    audioUrl: "https://videos.example/jobs/job/voice.mp3",
    aspect: project.brief.aspect,
    engine: "heygen-avatar-6-turbo",
    motionPrompt: project.scenes[0].camera,
  })
  assert.equal(body.resolution, "1080p")
  assert.equal(body.type, "avatar")
  assert.equal(body.avatar_id, "ava-lets-get-started")
  assert.equal(body.audio_url.startsWith("https://"), true)
  assert.equal(body.engine.type, "heygen-avatar-6-turbo")
  assert.equal(body.voice_id, undefined)
  assert.equal(JSON.stringify(body).includes("clone-voice"), false)
  assert.equal(JSON.stringify(body).includes("premade-bella"), false)
  assert.equal(JSON.stringify(body).includes("720"), false)
  assert.equal(project.scenes.every((scene) => scene.lighting === project.lighting), true)
})

test("the default 3.5 minute cut lands in the cost band, and Grok is the B-roll camera", () => {
  const table = cost.costTable()
  const standard = table.find((row) => row.id === "default")
  assert.ok(standard.usd >= 15 && standard.usd <= 25, `expected 15-25, got ${standard.usd}`)
  assert.equal(standard.withinTarget, true)
  const talking = table.find((row) => row.id === "grok-talking")
  assert.equal(talking.withinTarget, false)
  const plate = grok.grokVideoRequest({
    model: "grok-imagine-video-1.5",
    prompt: "A warm bakery at dawn",
    durationMs: 8000,
    aspect: "16:9",
    referenceUrls: [],
    withAudio: false,
  })
  assert.equal(plate.resolution, "1080p")
  assert.equal(plate.reference_images, undefined)
  assert.equal(plate.generate_audio, false)
  const face = grok.grokVideoRequest({
    model: "grok-imagine-video-1.5",
    prompt: "The woman from <IMAGE_0>",
    durationMs: 8000,
    aspect: "9:16",
    referenceUrls: ["https://cdn.example.com/ava.jpg"],
    withAudio: false,
  })
  assert.equal(face.resolution, "720p")
  assert.equal(face.reference_images.length, 1)
  const lite = grok.grokVideoRequest({
    model: "grok-imagine-video-1.5-lite",
    prompt: "A street",
    durationMs: 8000,
    aspect: "16:9",
    referenceUrls: ["https://cdn.example.com/ava.jpg"],
    withAudio: false,
  })
  assert.equal(lite.reference_images, undefined)
})

test("a full mocked film reaches approval, then publish, without blocking on an unmeasured mouth", async () => {
  const log = []
  let timeline = null
  let renders = 0
  const store = video.memoryVideoStore()
  const env = {
    ...readyEnv,
    XAI_API_KEY: "xai-key",
    FAL_KEY: "fal-key",
    AVA_REFERENCE_IMAGE_URLS: "https://cdn.example.com/ava.jpg",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  }
  const idea = Array.from({ length: 14 }, (_, index) => `Point ${index + 1} is a clear spoken line about the bakery and the next step for the owner.`).join(" ")
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief({ idea, style: "cinematic", seconds: 210 }) },
    env,
    tools,
    store,
    editorReady: async () => ({ ok: true }),
    fetchImpl: providerFetch(log),
    render: async (cut) => {
      renders += 1
      timeline = cut
      return { url: "https://cdn.example.com/film.mp4", width: 1080, height: 1920, fps: 30, videoDurationMs: cut.durationMs, audioDurationMs: cut.durationMs }
    },
  })
  assert.equal(result.body.delivery, "review")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.videoUrl, "https://cdn.example.com/film.mp4")
  assert.match(result.body.reasons.join(" "), /mouth|approve|published/i)
  assert.ok(timeline)
  assert.equal(timeline.compositionId, "AvaFilm")
  assert.equal(timeline.width, 1080)
  assert.ok(timeline.video.some((clip) => clip.role === "talking"))
  assert.ok(timeline.video.some((clip) => clip.role !== "talking"))
  assert.ok(timeline.video.some((clip) => clip.fadeMs === 400))
  assert.equal(timeline.music.gain, 0.18)
  assert.ok(timeline.captions.length > 0)
  const heygenBody = log.find((call) => call.method === "POST" && call.url.includes("api.heygen.com/v3/videos"))
  assert.ok(heygenBody)
  assert.equal(heygenBody.body.engine.type, "heygen-avatar-6-turbo")
  assert.equal(heygenBody.body.resolution, "1080p")
  assert.equal(heygenBody.body.audio_url.startsWith("https://"), true)
  assert.equal(heygenBody.body.voice_id, undefined)
  const grokBodies = log.filter((call) => call.method === "POST" && call.url.includes("/v1/videos/generations")).map((call) => call.body)
  assert.ok(grokBodies.length > 0)
  assert.ok(grokBodies.every((body) => body.model === "grok-imagine-video-1.5"))
  assert.ok(grokBodies.some((body) => body.reference_images))
  const saved = await store.load(result.body.jobId)
  assert.equal(saved.stage, "review")
  const approved = await video.handleVideoRequest({
    action: "approve",
    payload: { jobId: result.body.jobId },
    env,
    tools,
    store,
    editorReady: async () => ({ ok: true }),
    render: async () => { throw new Error("approve should not render") },
    fetchImpl: async () => { throw new Error("approve should not call a vendor") },
  })
  assert.equal(approved.body.delivery, "final")
  assert.equal(approved.body.delivered, true)
  assert.equal(approved.body.videoUrl, "https://cdn.example.com/film.mp4")
  assert.equal(renders, 1)
})

test("a below-1080 master is not offered", async () => {
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief({ style: "cinematic" }) },
    env: { ...readyEnv, XAI_API_KEY: "xai-key", FAL_KEY: "fal-key" },
    tools,
    store: video.memoryVideoStore(),
    editorReady: async () => ({ ok: true }),
    fetchImpl: providerFetch([]),
    render: async (cut) => ({ url: "https://cdn.example.com/small.mp4", width: 720, height: 1280, fps: 30, videoDurationMs: cut.durationMs, audioDurationMs: cut.durationMs }),
  })
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.videoUrl, "")
  assert.match(result.body.reasons.join(" "), /1080p/)
})

test("a bad duration is cut again and the failed file is not published", async () => {
  let renders = 0
  const result = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief({ style: "presenter" }) },
    env: readyEnv,
    tools,
    store: video.memoryVideoStore(),
    editorReady: async () => ({ ok: true }),
    fetchImpl: providerFetch([]),
    probe: async () => ({ videoDurationMs: 4000, audioDurationMs: 9000, lipSyncOffsetMs: 10, blackFrameCount: 0, frozenSeconds: 0 }),
    render: async () => {
      renders += 1
      return { url: "https://cdn.example.com/bad.mp4", width: 1080, height: 1920, fps: 30, videoDurationMs: 4000, audioDurationMs: 9000 }
    },
  })
  assert.equal(result.body.delivery, "blocked")
  assert.equal(result.body.delivered, false)
  assert.equal(result.body.videoUrl, "")
  assert.ok(renders >= 2)
  assert.match(result.body.reasons.join(" "), /do not end together/)
})

test("an unmeasured mouth does not block the film from review", () => {
  const decision = gate.decide([
    { id: "lip-sync", label: "Lip sync", state: "not_measured", detail: "The mouth timing was not measured." },
    { id: "resolution", label: "Resolution", state: "pass", detail: "1080p" },
  ], 1)
  assert.equal(decision.deliver, false)
  assert.equal(decision.review, true)
  assert.equal(decision.retryable, false)
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

test("the editor mixes the voice and the music from local files only", () => {
  const edit = load("lib/video/edit-plan.ts")
  const refused = edit.planEdit({
    width: 1080,
    height: 1920,
    fps: 30,
    clips: [{ file: "https://cdn.example.com/ava.mp4", durationSec: 4, fadeSec: 0, sound: "separate", startMs: 0 }],
    voices: [],
    music: null,
  })
  assert.equal(refused.filter, undefined)
  assert.match(refused.error, /local files/)
  const plan = edit.planEdit({
    width: 1080,
    height: 1920,
    fps: 30,
    clips: [
      { file: "/tmp/talk.mp4", durationSec: 6, fadeSec: 0, sound: "separate", startMs: 0 },
      { file: "/tmp/plate.mp4", durationSec: 4, fadeSec: 0.4, sound: "separate", startMs: 6000 },
    ],
    voices: [
      { file: "/tmp/voice-a.mp3", startMs: 0, gain: 1 },
      { file: "/tmp/voice-b.mp3", startMs: 6000, gain: 1 },
    ],
    music: { file: "/tmp/bed.mp3", gain: 0.18 },
  })
  assert.equal(plan.inputs.some((file) => file.startsWith("http")), false)
  assert.match(plan.filter, /adelay=6000\|6000/)
  assert.match(plan.filter, /volume=0\.18/)
  assert.match(plan.filter, /amix=/)
  assert.equal(/xfade=/.test(plan.filter), false)
  assert.equal(/apad/.test(plan.filter), false)
  assert.match(plan.filter, /fade=t=in/)
  assert.match(plan.filter, /concat=n=2/)
  assert.match(plan.filter, /atrim=duration=10/)
  assert.equal(plan.durationSec, 10)
})

test("a second worker cannot claim a film that is already being cut", async () => {
  const store = video.memoryVideoStore()
  const job = load("lib/video/job.ts").createVideoJob({
    app: "studio",
    ownerId: "owner-a",
    brief: brief(),
  })
  await store.save(job)
  const first = await store.claim(job.id, "worker-1", 60_000)
  const second = await store.claim(job.id, "worker-2", 60_000)
  assert.equal(first.lockedBy, "worker-1")
  assert.equal(second, null)
  await store.release(job.id, "worker-1")
  const third = await store.claim(job.id, "worker-2", 60_000)
  assert.equal(third.lockedBy, "worker-2")
})

test("status checks stay on the video companies", () => {
  const vendors = load("lib/video/vendors.ts")
  assert.equal(vendors.allowedPollUrl("https://api.heygen.com/v3/videos/vid_1"), true)
  assert.equal(vendors.allowedPollUrl("https://queue.fal.run/fal-ai/ace-step/prompt-to-audio/requests/music_1"), true)
  assert.equal(vendors.allowedPollUrl("https://evil.example/steal"), false)
  assert.equal(vendors.allowedPollUrl("http://api.heygen.com/v3/videos/vid_1"), false)
})

test("fresh storage links replace the saved ones", () => {
  const jobs = load("lib/video/job.ts")
  const job = jobs.createVideoJob({ app: "studio", ownerId: "owner-a", brief: brief() })
  job.masterUrl = "https://old.example/master"
  job.assets = [{ kind: "master", path: "jobs/1/master.mp4", url: "https://old.example/master" }]
  const fresh = jobs.applyFreshUrls(job, [{ path: "jobs/1/master.mp4", url: "https://new.example/master?token=today" }])
  assert.equal(fresh.masterUrl, "https://new.example/master?token=today")
  assert.equal(fresh.assets[0].url, "https://new.example/master?token=today")
})

test("another person cannot open or approve a saved film", async () => {
  const store = video.memoryVideoStore()
  const env = { ...readyEnv, XAI_API_KEY: "xai-key", FAL_KEY: "fal-key" }
  const made = await video.handleVideoRequest({
    action: "render",
    payload: { brief: brief({ style: "presenter" }) },
    env,
    tools,
    store,
    app: "studio",
    ownerId: "11111111-1111-4111-8111-111111111111",
    editorReady: async () => ({ ok: true }),
    fetchImpl: providerFetch([]),
    render: async (cut) => ({ url: "https://cdn.example.com/film.mp4", width: 1080, height: 1920, fps: 30, videoDurationMs: cut.durationMs, audioDurationMs: cut.durationMs }),
  })
  assert.equal(made.body.delivery, "review")
  const stolen = await video.handleVideoRequest({
    action: "job",
    payload: { jobId: made.body.jobId },
    env,
    tools,
    store,
    app: "studio",
    ownerId: "22222222-2222-4222-8222-222222222222",
  })
  assert.equal(stolen.status, 404)
  assert.equal(stolen.body.videoUrl, undefined)
  const approve = await video.handleVideoRequest({
    action: "approve",
    payload: { jobId: made.body.jobId },
    env,
    tools,
    store,
    app: "studio",
    ownerId: "22222222-2222-4222-8222-222222222222",
  })
  assert.equal(approve.status, 404)
  const owner = await video.handleVideoRequest({
    action: "job",
    payload: { jobId: made.body.jobId },
    env,
    tools,
    store,
    app: "studio",
    ownerId: "11111111-1111-4111-8111-111111111111",
  })
  assert.equal(owner.status, 200)
  assert.equal(owner.body.videoUrl, "https://cdn.example.com/film.mp4")
  assert.equal(owner.body.delivery, "review")
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
