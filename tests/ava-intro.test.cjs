const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
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
    process: { env: {} },
  })
  return exports
}

const banned = load("lib/ava/banned-line.ts")
const intro = load("lib/video/ava-intro.ts")
const prepare = load("lib/video/prepare.ts")
const gate = load("lib/video/gate.ts")
const text = load("lib/video/text.ts")
const BANNED = "In the theater of life, we are all actors sharing the same scene."
function containsBanned(value) {
  return banned.omitBannedLine(value) !== value
}

const tools = {
  omitBannedLine: banned.omitBannedLine,
  spokenText: (value) => value.replace(/\bAva\b/g, "Ay-vuh"),
  containsBanned,
}

test("the Meet Ava script is a three-to-four-minute film with no invented proof", () => {
  const script = intro.INTRO_SCRIPT
  const words = text.wordCount(script)
  assert.ok(words >= 450 && words <= 550, `expected 3 to 4 minutes of words, got ${words}`)
  assert.ok(script.length < 8000)
  assert.equal(script.includes(BANNED), false)
  assert.equal(containsBanned(script), false)
  assert.match(script, /six helpers/i)
  assert.match(script, /Studio/)
  assert.match(script, /apps catalog/i)
  assert.match(script, /video maker/i)
  assert.match(script, /by voice/)
  assert.match(script, /done-for-you/)
  assert.match(script, /income is not guaranteed/i)
  assert.doesNotMatch(script, /\$\d/)
  const sentences = text.sentences(script)
  assert.equal(sentences.length, intro.INTRO_SHOTS.length)
  assert.equal(intro.introChapterTitles().length, 5)
})

test("the storyboard keeps one face, dissolves, and passes the local quality gate", () => {
  const project = prepare.prepareProject(intro.introBrief(), {
    HEYGEN_API_KEY: "heygen-key",
    AVA_AVATAR_ID: "ava-lets-get-started",
    ELEVENLABS_API_KEY: "eleven-key",
    AVA_VOICE_CLONE_ID: "clone-voice",
  }, tools).project
  assert.equal(project.title, "Meet Ava")
  assert.equal(project.brief.aspect, "16:9")
  assert.equal(project.brief.style, "cinematic")
  assert.equal(project.brief.seconds, 210)
  assert.equal(project.brief.attire, "black-suit")
  assert.equal(project.scenes.length, intro.INTRO_SHOTS.length)
  assert.ok(project.scenes.length <= 50)
  assert.ok(intro.INTRO_SHOTS.every((shot) => /All-black outfit/.test(shot.outfit)))
  assert.ok(project.spokenSeconds >= 180 && project.spokenSeconds <= 240)
  assert.match(project.spokenScript, /Ay-vuh/)
  assert.doesNotMatch(project.captionsVtt, /Ay-vuh/)
  const avatars = new Set(project.scenes.filter((scene) => scene.talking).map((scene) => scene.avatarId))
  assert.equal(avatars.size, 1)
  project.scenes.forEach((scene, index) => {
    if (index > 0) assert.match(scene.transition.toLowerCase(), /dissolve/)
    assert.doesNotMatch(`${scene.visual} ${scene.camera} ${scene.transition}`, /freeze frame|hold the last frame/i)
  })
  const checks = gate.localChecks(project, { containsBanned })
  assert.equal(checks.every((item) => item.state === "pass"), true, JSON.stringify(checks))
})

test("the player waits for a real url and never autoplays", () => {
  assert.equal(intro.avaIntroVideoUrl(""), "")
  assert.equal(intro.avaIntroVideoUrl("javascript:alert(1)"), "")
  assert.equal(intro.avaIntroVideoUrl("http://example.com/a.mp4"), "")
  assert.equal(intro.avaIntroVideoUrl("https://cdn.example.com/ava.mp4"), "https://cdn.example.com/ava.mp4")
  assert.equal(intro.avaIntroVideoUrl("/media/ava-intro.mp4"), "/media/ava-intro.mp4")
  const player = fs.readFileSync("components/home/meet-ava-player.tsx", "utf8")
  const section = fs.readFileSync("components/home/meet-ava.tsx", "utf8")
  assert.match(player, /Coming soon/)
  assert.match(player, /kind="captions"/)
  assert.match(player, /kind="chapters"/)
  assert.match(player, /preload="none"/)
  assert.doesNotMatch(player, /autoPlay|autoplay/)
  assert.match(section, /id="meet"/)
  assert.match(section, /AY-vuh/)
  const desk = fs.readFileSync("avaskye-online/src/components/video-desk.tsx", "utf8")
  const studio = fs.readFileSync("components/studio/video-maker.tsx", "utf8")
  assert.match(desk, /Load the Meet Ava intro/)
  assert.match(studio, /Load the Meet Ava intro/)
})

test("the saved script and captions match the film", () => {
  const doc = fs.readFileSync("docs/ava-intro-video-script.md", "utf8")
  const captions = fs.readFileSync("docs/ava-intro-video-captions.vtt", "utf8")
  const chapters = fs.readFileSync("docs/ava-intro-video-chapters.vtt", "utf8")
  assert.equal(doc, intro.introScriptMarkdown())
  assert.equal(captions, intro.introCaptionsVtt())
  assert.equal(chapters, intro.introChaptersVtt())
  // Public tracks belong to the current film; draft timing must not replace them before the new edit is approved.
  assert.match(captions, /^WEBVTT/)
  assert.match(chapters, /What DigiMark101 is/)
  assert.equal(doc.includes(BANNED), false)
})


test("the maker rejects oversized scripts instead of silently dropping scenes or words", () => {
  const brief = intro.introBrief()
  const tooMany = prepare.prepareProject({ ...brief, scriptOverride: Array.from({ length: 51 }, (_, index) => `Scene number ${index}.`).join(" ") }, {}, tools)
  assert.match(tooMany.error, /exceeds 50 scenes/)
  const tooLong = prepare.prepareProject({ ...brief, scriptOverride: "word ".repeat(1700) }, {}, tools)
  assert.match(tooLong.error, /exceeds 8000 characters/)
})
