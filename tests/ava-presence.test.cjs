const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, { exports: module.exports, module, require: () => { throw new Error("no imports") }, URL, process })
  return module.exports
}

const presence = load("lib/ava/presence.ts")
const video = load("lib/video/platform-walkthrough.ts")

test("Ava's public launcher is contextual and can be dismissed", () => {
  assert.equal(presence.helpfulAvaPath("/"), false)
  assert.equal(presence.helpfulAvaPath("/about"), false)
  assert.equal(presence.helpfulAvaPath("/blog"), false)
  assert.equal(presence.helpfulAvaPath("/pricing"), true)
  assert.equal(presence.helpfulAvaPath("/pricing/"), true)
  assert.equal(presence.helpfulAvaPath("/start/brief"), true)
  assert.equal(presence.helpfulAvaPath("/contact"), true)
  assert.equal(presence.helpfulAvaPath("/beta"), true)
  assert.equal(presence.helpfulAvaPath("/ava"), true)
  assert.equal(presence.helpfulAvaPath("/signup"), true)
  assert.equal(presence.AVA_DISMISS_KEY, "digimark101.ava.dismissed")
  const widget = fs.readFileSync("components/ava/ava-widget.tsx", "utf8")
  assert.match(widget, /helpfulAvaPath/)
  assert.match(widget, /startsWith\("\/studio"\)/)
  assert.match(widget, /Dismiss Ava/)
  assert.match(widget, /onLauncherClick/)
  assert.match(widget, /aria-controls/)
})

test("the walkthrough URL stays empty until a real file is configured", () => {
  assert.equal(video.platformWalkthroughUrl(""), "")
  assert.equal(video.platformWalkthroughUrl("javascript:alert(1)"), "")
  assert.equal(video.platformWalkthroughUrl("http://example.com/a.mp4"), "")
  assert.equal(video.platformWalkthroughUrl("https://cdn.example.com/walk.mp4"), "https://cdn.example.com/walk.mp4")
  assert.equal(video.platformWalkthroughUrl("/media/platform-walkthrough.mp4"), "/media/platform-walkthrough.mp4")
  assert.equal(video.platformWalkthroughWebm("/media/platform-walkthrough.mp4"), "/media/platform-walkthrough.webm")
  assert.equal(video.platformWalkthroughWebm("https://cdn.example.com/walk.mp4"), "")
  const player = fs.readFileSync("components/home/platform-video.tsx", "utf8")
  assert.equal(player.includes("autoPlay"), false)
  assert.match(player, /kind="captions"/)
  assert.match(player, /prefers-reduced-motion/)
})
