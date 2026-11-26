const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const crypto = require("node:crypto")

const cache = new Map()

function load(file) {
  const full = path.resolve(file.endsWith(".ts") ? file : `${file}.ts`)
  if (cache.has(full)) return cache.get(full)
  const code = ts.transpileModule(fs.readFileSync(full, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const dirname = path.dirname(full)
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require: (id) => {
      if (id === "server-only") return {}
      if (id === "node:crypto" || id === "crypto") return crypto
      if (id.startsWith("@/")) return load(id.slice(2))
      if (id.startsWith(".")) return load(path.join(dirname, id))
      throw new Error(`unexpected import ${id} from ${full}`)
    },
    Buffer,
    URL,
    URLSearchParams,
    crypto,
    console,
    process,
    TextEncoder,
    setTimeout,
    Promise,
  })
  cache.set(full, module.exports)
  return module.exports
}

const budget = load("lib/ava/team/budget.ts")
const approvals = load("lib/ava/team/approvals.ts")
const guard = load("lib/ava/team/guard.ts")
const profiles = load("lib/ava/team/profiles.ts")
const scope = load("lib/ava/team/scope.ts")
const brief = load("lib/ava/team/brief.ts")
const muse = load("lib/ava/team/muse.ts")
const digest = load("lib/ava/team/digest.ts")
const loop = load("lib/ava/team/loop.ts")
const connector = load("lib/ava/team/connector.ts")
const provider = load("lib/openai/provider.ts")
const sameAs = load("lib/seo/same-as.ts")
const dates = load("lib/seo/sitemap-dates.ts")
const indexnow = load("lib/indexnow.ts")
const traffic = load("lib/ava/team/providers.ts")
const run = load("lib/ava/team/run.ts")
const memory = load("lib/ava/team/memory-store.ts")
const registry = load("lib/ava/tools/registry.ts")
const toolDefs = load("lib/ava/team/tool-defs.ts")

const lookup = scope.lookupTools(registry.AVA_TOOLS.map((tool) => ({ apiName: tool.apiName, name: tool.name, effect: tool.effect })))
const quietChat = async () => ({ ok: true, text: "A draft with no numbers. Nothing was sent.", toolCalls: [], tokensIn: 20, tokensOut: 20 })

function baseBudget(extra) {
  return {
    paused: false,
    runTokens: 0,
    dayTokens: 0,
    agentMonthMicro: 0,
    totalMonthMicro: 0,
    perRunCap: 4000,
    dayCap: 20000,
    agentMonthCapCents: 1200,
    totalMonthCapCents: 6000,
    nextTokens: 100,
    nextMicro: 100,
    ...extra,
  }
}

test("the five monthly caps add up to the $60 team cap", () => {
  assert.equal(profiles.TEAM_PROFILES.length, 5)
  const sum = profiles.TEAM_PROFILES.reduce((total, profile) => total + profile.monthlyBudgetCents, 0)
  assert.equal(sum, budget.MONTHLY_TOTAL_CAP_CENTS)
  assert.equal(budget.MONTHLY_TOTAL_CAP_CENTS, 6000)
})

test("a per-run cap stops the run and does not pause the agent", () => {
  const decision = budget.decideBudget(baseBudget({ runTokens: 3900, nextTokens: 200 }))
  assert.equal(decision.allow, false)
  assert.equal(decision.pause, false)
})

test("a daily token cap pauses that agent", () => {
  const decision = budget.decideBudget(baseBudget({ dayTokens: 20000 }))
  assert.equal(decision.allow, false)
  assert.equal(decision.pause, true)
  assert.equal(decision.pauseAll, false)
})

test("an agent monthly cap pauses that agent", () => {
  const decision = budget.decideBudget(baseBudget({ agentMonthMicro: 12_000_000 }))
  assert.equal(decision.pause, true)
  assert.equal(decision.pauseAll, false)
})

test("the team monthly cap pauses every agent", () => {
  const decision = budget.decideBudget(baseBudget({ totalMonthMicro: 60_000_000 }))
  assert.equal(decision.pauseAll, true)
})

test("a paused agent is refused before another model call", () => {
  const decision = budget.decideBudget(baseBudget({ paused: true, nextTokens: 1 }))
  assert.equal(decision.allow, false)
  assert.match(decision.reason, /paused/i)
})

test("the bounded loop does not call the model once the run cap is already spent", async () => {
  let called = false
  const result = await loop.runBoundedLoop({
    system: "draft",
    brief: brief.parseBrief({ goal: "Write a note" }),
    allow: ["traffic_audit"],
    sources: [],
    lookup,
    chat: async () => {
      called = true
      return { ok: true, text: "no", toolCalls: [], tokensIn: 1, tokensOut: 1 }
    },
    execute: async () => ({ summary: "ran" }),
    budget: baseBudget({ perRunCap: 10, nextTokens: 0, nextMicro: 0 }),
    tools: [{ name: "traffic_audit" }],
  })
  assert.equal(called, false)
  assert.match(result.stopped, /token cap/i)
})

test("content cannot call social.publish", () => {
  const content = profiles.teamProfile("content")
  assert.equal(scope.classifyCall(content.tools, "social_publish", lookup("social_publish")), "deny")
})

test("nurture cannot call campaigns.send", () => {
  const nurture = profiles.teamProfile("nurture")
  assert.equal(scope.classifyCall(nurture.tools, "campaigns_send", lookup("campaigns_send")), "deny")
})

test("outreach cannot call inbox.send", () => {
  const outreach = profiles.teamProfile("outreach")
  assert.equal(scope.classifyCall(outreach.tools, "inbox_send", lookup("inbox_send")), "deny")
})

test("an unknown tool is denied", () => {
  assert.equal(scope.classifyCall(["traffic_audit"], "made_up_tool", null), "deny")
})

test("sentinel is read-only and every allow-list tool exists", () => {
  const effects = new Map(registry.AVA_TOOLS.map((tool) => [tool.apiName, tool.effect]))
  const sentinel = profiles.teamProfile("sentinel")
  assert.equal(scope.allowListIsReadOnly(sentinel, effects), true)
  for (const profile of profiles.TEAM_PROFILES) {
    for (const name of profile.tools) assert.equal(effects.has(name), true, name)
    for (const blocked of ["social_publish", "campaigns_send", "inbox_send", "invoices_request_payment"]) {
      if (profile.slug !== "content" || blocked !== "social_publish") assert.equal(profile.tools.includes(blocked), false)
    }
  }
  assert.equal(sentinel.tools.includes("social_publish"), false)
})

test("an allow-listed publish request is filed, not executed", async () => {
  let executed = 0
  const content = profiles.teamProfile("content")
  const result = await loop.runBoundedLoop({
    system: content.prompt,
    brief: brief.parseBrief({ goal: "Turn the cluster into a post" }),
    allow: content.tools,
    sources: ["Turn the cluster into a post"],
    lookup,
    chat: (() => {
      let step = 0
      return async () => {
        step += 1
        const toolCalls = step === 1
          ? [
            { name: "social_publish", arguments: "{\"body\":\"Hi\"}" },
            { name: "content_request_publish", arguments: "{\"id\":\"post-1\",\"body\":\"Hi\"}" },
          ]
          : []
        return { ok: true, text: "Draft only.", toolCalls, tokensIn: 10, tokensOut: 10 }
      }
    })(),
    execute: async () => {
      executed += 1
      return { summary: "ran" }
    },
    budget: baseBudget(),
    tools: content.tools.map((name) => ({ name })),
  })
  assert.equal(executed, 0)
  assert.equal(JSON.stringify(result.denied), JSON.stringify(["social_publish"]))
  assert.equal(result.approvals.length, 1)
  assert.equal(result.approvals[0].tool, "content_request_publish")
})

test("approval checks actor, tool, target, params, and expiry", () => {
  const now = new Date("2026-11-26T00:00:00Z")
  const row = {
    status: "pending",
    actorId: "owner",
    tool: "content_request_publish",
    target: "post-1",
    params: { id: "post-1", body: "Hi" },
    expiresAt: "2026-12-01T00:00:00Z",
  }
  const ok = { actorId: "owner", tool: "content_request_publish", target: "post-1", params: { body: "Hi", id: "post-1" } }
  assert.equal(approvals.checkApproval(row, ok, now).ok, true)
  assert.equal(approvals.checkApproval(row, { ...ok, actorId: "other" }, now).ok, false)
  assert.equal(approvals.checkApproval(row, { ...ok, tool: "inbox_send" }, now).ok, false)
  assert.equal(approvals.checkApproval(row, { ...ok, target: "post-2" }, now).ok, false)
  assert.equal(approvals.checkApproval(row, { ...ok, params: { id: "post-1", body: "Changed" } }, now).ok, false)
  assert.equal(approvals.checkApproval({ ...row, expiresAt: "2026-11-01T00:00:00Z" }, ok, now).ok, false)
})

test("a mismatched approval does not execute, and a second click does not execute again", async () => {
  const store = memory.memoryTeamStore()
  const saved = await store.addApproval({
    ownerId: "owner",
    actorId: "owner",
    runId: null,
    tool: "content_request_publish",
    target: "post-1",
    params: { id: "post-1" },
    paramsHash: "hash",
    effect: "outbound",
    expiresAt: "2026-12-01T00:00:00Z",
  })
  let executed = 0
  const execute = async () => {
    executed += 1
    return { summary: "queued" }
  }
  const now = new Date("2026-11-26T00:00:00Z")
  const mismatch = await run.decideOwnerApproval({
    store,
    ownerId: "owner",
    actorId: "owner",
    approvalId: saved.id,
    now,
    execute,
    override: { params: { id: "other" } },
  })
  assert.equal(mismatch.executed, false)
  assert.equal(executed, 0)
  const match = await run.decideOwnerApproval({ store, ownerId: "owner", actorId: "owner", approvalId: saved.id, now, execute })
  assert.equal(match.executed, true)
  assert.equal(executed, 1)
  const again = await run.decideOwnerApproval({ store, ownerId: "owner", actorId: "owner", approvalId: saved.id, now, execute })
  assert.equal(again.executed, false)
  assert.equal(executed, 1)
})

test("an idempotency key does not start a second model call", async () => {
  const store = memory.memoryTeamStore()
  let calls = 0
  const input = {
    ownerId: "owner",
    actorId: "owner",
    slug: "traffic",
    brief: { goal: "Outline three clusters" },
    idempotencyKey: "clusters-1",
    store,
    chat: async () => {
      calls += 1
      return quietChat()
    },
    lookup,
    execute: async () => ({ summary: "ok" }),
    toolsFor: () => [],
  }
  const first = await run.runTeamAgent(input)
  const second = await run.runTeamAgent(input)
  assert.equal(first.reused, false)
  assert.equal(second.reused, true)
  assert.equal(second.runId, first.runId)
  assert.equal(calls, 1)
})

test("a daily cap reached in storage does not call the model and pauses the agent", async () => {
  const store = memory.memoryTeamStore()
  const seeded = await store.createRun({
    ownerId: "owner",
    slug: "content",
    status: "done",
    brief: brief.parseBrief({ goal: "Earlier work" }),
    idempotencyKey: null,
    parentRunId: null,
    taskId: null,
  })
  await store.updateRun(seeded.id, { tokensIn: 20000, tokensOut: 0, costMicroUsd: 0 })
  let calls = 0
  const result = await run.runTeamAgent({
    ownerId: "owner",
    actorId: "owner",
    slug: "content",
    brief: { goal: "Another post" },
    store,
    chat: async () => {
      calls += 1
      return quietChat()
    },
    lookup,
    execute: async () => ({ summary: "ok" }),
    toolsFor: () => [],
  })
  assert.equal(calls, 0)
  assert.equal(result.paused, true)
  assert.equal((await store.profile("owner", "content")).paused, true)
})

test("empty KPI text does not invent clicks, and a stored row is repeated", () => {
  const empty = digest.trafficDigest({ kpis: [], missing: ["gsc", "ga4", "bing"] })
  assert.equal(/\d+\s+clicks/i.test(empty), false)
  assert.match(empty, /not connected/i)
  const filled = digest.trafficDigest({
    kpis: [{ source: "gsc", metric: "clicks", value: 12, periodStart: "2026-11-01", periodEnd: "2026-11-01" }],
    missing: [],
  })
  assert.match(filled, /gsc clicks 12/)
  assert.equal(guard.inventedMetrics(filled, digest.digestSources([{ source: "gsc", metric: "clicks", value: 12, periodStart: "2026-11-01", periodEnd: "2026-11-01" }])).length, 0)
})

test("invented metrics and the banned line fail review, and helper names are removed", () => {
  assert.equal(guard.reviewArtifact("The page earned 1200 clicks.", []).pass, false)
  assert.equal(guard.reviewArtifact("No measurement is stored. Nothing was sent.", []).pass, true)
  const banned = "In the theater of life, we are all actors sharing the same scene."
  assert.equal(guard.reviewArtifact(banned, []).pass, false)
  const cleaned = guard.clientSafeText(`The Sentinel wrote this. ${banned} Hello.`)
  assert.equal(/sentinel/i.test(cleaned), false)
  assert.equal(/theater of life/i.test(cleaned), false)
  assert.match(cleaned, /Hello/)
})

test("starter drafts do not invent a ranking or a click count", () => {
  for (const slug of profiles.TEAM_SLUGS) {
    const draft = profiles.localDraft(slug, "free organic traffic")
    assert.equal(/\d+\s+(clicks|impressions|rankings)/i.test(draft.body), false)
    const review = guard.reviewArtifact(draft.body, [draft.body])
    assert.equal(review.pass, true, `${slug}: ${review.issues.join(", ")}`)
  }
})

test("a Muse brief has the fields Shawn pastes, and a result with a fake metric is held", () => {
  const parsed = brief.parseBrief({ goal: "Write a homepage hero" })
  const text = muse.museBriefText(parsed)
  for (const label of ["Goal:", "Audience:", "Brand voice:", "Assets:", "Constraints:", "Deadline:", "Approval needs:", "Success metric:"]) {
    assert.equal(text.includes(label), true, label)
  }
  const review = muse.reviewMuseResult("This page gets 4000 sessions a month.", parsed)
  assert.equal(review.review.pass, false)
})

test("sameAs keeps https URLs only", () => {
  const urls = sameAs.sameAsFromEnv("http://example.com, https://www.linkedin.com/company/digimark101, not a url", [])
  assert.equal(JSON.stringify(urls), JSON.stringify(["https://www.linkedin.com/company/digimark101"]))
})

test("sitemap dates come from the page, not one hard-coded stamp", () => {
  const home = dates.pageLastModified({ path: "/", mtime: () => new Date("2026-01-02T00:00:00Z") })
  const post = dates.pageLastModified({ path: "/blog/example", contentDate: "2026-10-01", mtime: () => new Date("2026-03-03T00:00:00Z") })
  assert.equal(home.toISOString().slice(0, 10), "2026-01-02")
  assert.equal(post.toISOString().slice(0, 10), "2026-10-01")
  assert.equal(fs.readFileSync("app/sitemap.ts", "utf8").includes("2026-11-18T00:00:00Z"), false)
})

test("IndexNow is unconfigured without a key and ignores a mismatched key", () => {
  assert.equal(indexnow.indexNowKey({}), null)
  assert.equal(indexnow.indexNowKey({ INDEXNOW_KEY: "short" }), null)
  assert.equal(indexnow.indexNowKey({ INDEXNOW_KEY: "abcd1234" }), "abcd1234")
  assert.equal(indexnow.indexNowKeyBody("abcd1234", "zzzzzzzz"), null)
  assert.equal(indexnow.indexNowKeyBody("abcd1234", "abcd1234"), "abcd1234")
})

test("traffic providers stay disconnected until their env vars exist", () => {
  const flags = traffic.trafficProviderFlags({})
  assert.equal(flags.every((flag) => flag.configured === false), true)
  const parsed = traffic.metricsFromSearchConsole({ rows: [{ keys: ["2026-11-01"], clicks: 4, impressions: 9 }] })
  assert.equal(parsed.length, 2)
  assert.equal(traffic.metricsFromSearchConsole({}).length, 0)
})

test("the Muse connector fails closed, and Meta contributor models are refused", () => {
  assert.equal(connector.connectorAuthorized(null, ""), false)
  assert.equal(connector.connectorAuthorized("Bearer secret", "secret"), true)
  assert.equal(connector.connectorAuthorized("Bearer other", "secret"), false)
  assert.equal(provider.specialistEndpoint({}, { apiKey: "sk", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1" }).provider, "openai")
  assert.equal(provider.specialistEndpoint({
    AVA_SPECIALIST_PROVIDER: "meta",
    META_MODEL_API_KEY: "key",
    META_MODEL: "muse-spark-1.3-contributor",
  }, null), null)
  const meta = provider.specialistEndpoint({
    AVA_SPECIALIST_PROVIDER: "meta",
    META_MODEL_API_KEY: "key",
    META_MODEL: "muse-spark-1.3",
  }, null)
  assert.equal(meta.provider, "meta")
  assert.equal(meta.baseUrl, "https://api.meta.ai/v1")
})

test("a nurture send and a form use their own fields, not one shared schema", () => {
  const defs = toolDefs.specialistToolDefs(profiles.teamProfile("nurture").tools)
  const form = defs.find((tool) => tool.function.name === "forms_create")
  const campaign = defs.find((tool) => tool.function.name === "campaigns_draft")
  const send = defs.find((tool) => tool.function.name === "nurture_request_send")
  assert.ok(form.function.parameters.required.includes("name"))
  assert.ok(campaign.function.parameters.required.includes("name"))
  assert.ok(send.function.parameters.properties.id)
  assert.ok(send.function.parameters.properties.name)
  assert.equal(defs.some((tool) => tool.function.name === "social_publish"), false)
})

test("the model sees the brief's voice, assets, deadline, and notes", async () => {
  let user = ""
  await loop.runBoundedLoop({
    system: "draft",
    brief: brief.parseBrief({
      goal: "Write a note",
      audience: "shop owners",
      brandVoice: "plain and warm",
      assets: ["logo.png"],
      constraints: "no invented numbers",
      deadline: "Friday",
      approvalNeeds: "Shawn approves a send",
      successMetric: "a draft he can edit",
      notes: "use the pasted outline",
    }),
    allow: [],
    sources: [],
    lookup,
    chat: async (input) => {
      user = input.user
      return { ok: true, text: "A draft with no numbers.", toolCalls: [], tokensIn: 5, tokensOut: 5 }
    },
    execute: async () => ({ summary: "ran" }),
    budget: baseBudget(),
    tools: [],
  })
  for (const line of ["shop owners", "plain and warm", "logo.png", "Friday", "Shawn approves a send", "a draft he can edit", "use the pasted outline"]) {
    assert.equal(user.includes(line), true, line)
  }
})

test("a later loop turn counts the tokens the earlier turn already spent", async () => {
  let calls = 0
  const result = await loop.runBoundedLoop({
    system: "draft",
    brief: brief.parseBrief({ goal: "Write a note" }),
    allow: ["traffic_audit"],
    sources: ["Write a note"],
    lookup,
    chat: async () => {
      calls += 1
      return { ok: true, text: "A draft.", toolCalls: [{ name: "traffic_audit", arguments: "{}" }], tokensIn: 3000, tokensOut: 3000 }
    },
    execute: async () => ({ summary: "Site checks only." }),
    budget: baseBudget({ dayCap: 5000, perRunCap: 20000 }),
    tools: [{ name: "traffic_audit" }],
  })
  assert.equal(calls, 1)
  assert.match(result.stopped, /daily token cap/i)
})

test("only the first claim of an approval can run the tool", async () => {
  const store = memory.memoryTeamStore()
  const saved = await store.addApproval({
    ownerId: "owner",
    actorId: "owner",
    runId: null,
    tool: "indexnow_submit",
    target: "https://www.digimark101.com/",
    params: { url: "https://www.digimark101.com/" },
    paramsHash: "hash",
    effect: "outbound",
    expiresAt: "2026-12-01T00:00:00Z",
  })
  const now = "2026-11-26T00:00:00.000Z"
  const first = await store.claimApproval("owner", saved.id, "owner", now)
  const second = await store.claimApproval("owner", saved.id, "owner", now)
  assert.equal(Boolean(first), true)
  assert.equal(second, null)
})

test("the playbook and the migration file are in the repo", () => {
  const doc = fs.readFileSync("docs/AVA_TEAM.md", "utf8")
  for (const week of ["Week 1", "Week 2", "Week 3", "Week 4"]) assert.equal(doc.includes(week), true)
  assert.equal(doc.includes("INDEXNOW_KEY"), true)
  assert.equal(doc.includes("20261126_ava_team.sql"), true)
  assert.equal(fs.existsSync("supabase/migrations/20261126_ava_team.sql"), true)
  const sql = fs.readFileSync("supabase/migrations/20261126_ava_team.sql", "utf8")
  assert.match(sql, /claim_agent_tasks/)
  assert.match(sql, /is_owner\(\)/)
  assert.match(sql, /assign_workspace/)
})
