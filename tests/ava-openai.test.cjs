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
      if (id === "server-only") return {}
      if (imports[id]) return imports[id]
      throw new Error(id)
    },
    process,
    console,
    AbortSignal,
    URL,
    setTimeout,
    Promise,
  })
  return exports
}

const BANNED = "In the theater of life, we are all actors sharing the same scene."
const banned = load("lib/ava/banned-line.ts")
const helpers = load("lib/openai/helpers.ts", { "@/lib/ava/banned-line": banned })
const delegate = load("lib/openai/delegate.ts")
const openai = load("lib/openai/server.ts")

function clean(text) {
  return helpers.hideInternalNames(banned.omitBannedLine(text))
}

test("the office uses the same OpenAI client, helper prompts, and delegation runner", () => {
  for (const name of ["server.ts", "helpers.ts", "delegate.ts"]) {
    assert.equal(
      fs.readFileSync(`lib/openai/${name}`, "utf8"),
      fs.readFileSync(`avaskye-online/src/lib/openai/${name}`, "utf8"),
      name,
    )
  }
})

test("a missing key does not call OpenAI and does not reveal a secret", async () => {
  let called = false
  const secret = "sk-test-secret-value"
  const result = await openai.openAiChat({
    env: {},
    messages: [{ role: "user", content: "Write a homepage" }],
    fetchImpl: async () => {
      called = true
      throw new Error("should not run")
    },
  })
  assert.equal(called, false)
  assert.equal(result.ok, false)
  assert.equal(result.reason, "missing")
  assert.match(result.message, /OPENAI_API_KEY/)
  assert.match(result.message, /did not make up/)
  assert.equal(result.message.includes(secret), false)
  const status = openai.openAiStatus({ OPENAI_API_KEY: secret, OPENAI_MODEL: "gpt-4o-mini" })
  assert.equal(status.connected, true)
  assert.equal(status.model, "gpt-4o-mini")
  assert.equal(status.voice, "coral")
  assert.equal(JSON.stringify(status).includes(secret), false)
  assert.equal(openai.openAiStatus({}).connected, false)
  assert.equal(openai.DEFAULT_OPENAI_MODEL, "gpt-4o-mini")
  assert.equal(openai.OPENAI_PLATFORM_VOICE, "coral")
})

test("a live reply does not echo the key", async () => {
  const secret = "sk-live-secret-value"
  const result = await openai.openAiChat({
    env: { OPENAI_API_KEY: secret },
    messages: [{ role: "user", content: "Hi" }],
    tools: [{ type: "function", function: { name: "delegate_work" } }],
    fetchImpl: async (url, init) => {
      assert.equal(url, "https://api.openai.com/v1/chat/completions")
      assert.equal(init.headers.Authorization, `Bearer ${secret}`)
      const body = JSON.parse(init.body)
      assert.equal(body.model, "gpt-4o-mini")
      assert.equal(body.tool_choice, "auto")
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: "Hello",
              tool_calls: [{ id: "call_1", function: { name: "delegate_work", arguments: "{\"jobs\":[]}" } }],
            },
          }],
        }),
      }
    },
  })
  assert.equal(result.ok, true)
  assert.equal(result.toolCalls[0].name, "delegate_work")
  assert.equal(JSON.stringify(result).includes(secret), false)
})

test("delegation runs at most six helpers, queues the rest, and drops the banned line", async () => {
  assert.equal(helpers.HELPER_ROLES.length, 6)
  assert.match(helpers.avaReviewSystem(), /one finished answer/)
  assert.match(helpers.avaReviewSystem(), /BANNED_LINE_RULE|theater of life/)
  let active = 0
  let peak = 0
  let helperCalls = 0
  let reviewCalls = 0
  const seen = []
  const jobs = Array.from({ length: 8 }, (_, index) => ({ role: "copywriter", brief: `Page ${index}` }))
  const outcome = await delegate.delegateWave({
    jobs,
    max: helpers.HELPER_CAP,
    ask: "Write eight pages",
    context: "",
    systemFor: helpers.helperSystemPrompt,
    toolsFor: helpers.helperTools,
    reviewSystem: helpers.avaReviewSystem(),
    clean,
    missingMessage: openai.OPENAI_MISSING_OWNER,
    failedMessage: openai.OPENAI_FAILED_MESSAGE,
    chat: async ({ system, user }) => {
      if (system.includes("one finished answer")) {
        reviewCalls += 1
        return { ok: true, text: `${BANNED} The page is ready. Nothing was sent. The copywriter helped.`, toolCalls: [] }
      }
      helperCalls += 1
      seen.push(user)
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 30))
      assert.ok(active <= 6)
      active -= 1
      return { ok: true, text: `${BANNED} A short page from the copywriter bot.`, toolCalls: [{ name: "start_campaign", arguments: "{\"name\":\"Spring\"}" }] }
    },
  })
  assert.equal(helperCalls, 6)
  assert.equal(reviewCalls, 1)
  assert.equal(peak, 6)
  assert.equal(outcome.ran.length, 6)
  assert.equal(outcome.queued.length, 2)
  assert.equal(outcome.queued.map((job) => job.brief).join(","), "Page 6,Page 7")
  assert.equal(seen.some((brief) => brief.includes("Page 6") || brief.includes("Page 7")), false)
  assert.equal(/theater of life/i.test(outcome.text), false)
  assert.equal(/copywriter/i.test(outcome.text), false)
  assert.match(outcome.text, /page is ready/i)
  assert.equal(/theater of life/i.test(outcome.drafts[0].text), false)
  assert.equal(outcome.missing, false)
})

test("a missing key during delegation does not invent a starter draft", async () => {
  let calls = 0
  const outcome = await delegate.delegateWave({
    jobs: [{ role: "copywriter", brief: "Write a pricing page" }, { role: "seo", brief: "Outline the homepage" }],
    max: 6,
    ask: "Write the page",
    context: "",
    systemFor: () => "helper",
    toolsFor: () => [],
    reviewSystem: "one finished answer",
    clean,
    missingMessage: openai.OPENAI_MISSING_OWNER,
    failedMessage: openai.OPENAI_FAILED_MESSAGE,
    chat: async () => {
      calls += 1
      return { ok: false, reason: "missing", message: openai.OPENAI_MISSING_OWNER }
    },
  })
  assert.equal(calls, 2)
  assert.equal(outcome.missing, true)
  assert.equal(outcome.text, openai.OPENAI_MISSING_OWNER)
  assert.equal(/starter draft|sk-|gpt-/i.test(outcome.text), false)
  assert.equal(/theater of life/i.test(outcome.text), false)
})

test("Ava's brain and the office no longer call xAI or invent a guide answer", () => {
  const respond = fs.readFileSync("lib/ava/respond.ts", "utf8")
  const runner = fs.readFileSync("lib/ava/specialist-run.ts", "utf8")
  const office = fs.readFileSync("avaskye-online/src/app/api/office/guide/route.ts", "utf8")
  for (const source of [respond, runner, office]) {
    assert.equal(source.includes("XAI_API_KEY"), false)
    assert.equal(source.includes("api.x.ai"), false)
    assert.match(source, /BANNED_LINE_RULE|omitBannedLine/)
  }
  assert.equal(runner.includes("localSpecialistDraft"), false)
  assert.match(runner, /specialist_tasks/)
  assert.match(office, /openAiChat/)
  assert.match(fs.readFileSync("avaskye-online/src/lib/office-store.ts", "utf8"), /OPENAI_API_KEY/)
  assert.equal(fs.readFileSync("avaskye-online/src/components/openai-status.tsx", "utf8").includes("OPENAI_API_KEY?.slice"), false)
})
