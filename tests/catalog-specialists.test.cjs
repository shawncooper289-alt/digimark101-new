const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, requireImpl) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require: requireImpl,
    Buffer,
    URL,
    setTimeout,
    Promise,
  })
  return module.exports
}

const types = load("lib/platform/types.ts", () => {
  throw new Error("types.ts has no imports")
})
const banned = load("lib/ava/banned-line.ts", () => {
  throw new Error("banned-line.ts has no imports")
})
const catalog = load("lib/platform/catalog.ts", (id) => {
  if (String(id).includes("platform/types")) return types
  throw new Error(id)
})
const helpers = load("lib/openai/helpers.ts", (id) => {
  if (String(id).includes("banned-line")) return banned
  throw new Error(id)
})
const specialists = load("lib/ava/specialists.ts", (id) => {
  if (String(id).includes("banned-line")) return banned
  if (String(id).includes("platform/types")) return types
  if (String(id).includes("openai/helpers")) return helpers
  throw new Error(id)
})
const deskAuth = load("avaskye-online/src/lib/desk-auth.ts", () => {
  throw new Error("desk-auth.ts has no imports")
})

test("every coming-soon app is labeled coming soon and does not pretend to send", () => {
  const soon = catalog.CATALOG_APPS.filter((app) => app.status === "soon")
  assert.ok(soon.length >= 20)
  for (const app of soon) {
    assert.equal(catalog.statusLabel(app.status), "Coming soon")
    assert.equal(/sends it now|already connected|is live/i.test(app.today), false)
  }
  const groups = new Set(catalog.CATALOG_APPS.map((app) => app.group))
  for (const name of ["Email and customer list", "Social", "Ads", "Payments", "Scheduling", "Analytics", "Online store", "Text and phone", "Video", "Reviews", "Connections"]) {
    assert.ok(groups.has(name), name)
  }
})

test("working automatic notes use the real trigger and action, and coming-soon ones do not", () => {
  const works = catalog.CATALOG_RECIPES.filter((recipe) => recipe.status === "works")
  assert.equal(works.length, 6)
  for (const recipe of works) {
    assert.ok(types.triggers.includes(recipe.trigger))
    assert.ok(types.automationActions.includes(recipe.action))
  }
  for (const recipe of catalog.CATALOG_RECIPES.filter((item) => item.status === "soon")) {
    assert.equal(recipe.trigger, undefined)
    assert.equal(recipe.action, undefined)
  }
})

test("PayPal is coming soon until the page says checkout is ready", () => {
  const plain = catalog.CATALOG_APPS.find((app) => app.id === "paypal")
  assert.equal(plain.status, "soon")
  const ready = catalog.withPaypalReady(catalog.CATALOG_APPS, true).find((app) => app.id === "paypal")
  assert.equal(ready.status, "works")
  assert.match(ready.today, /pricing page/i)
})

test("the client catalog does not mention hidden helpers", () => {
  const source = fs.readFileSync("lib/platform/catalog.ts", "utf8") + fs.readFileSync("components/studio/catalog-board.tsx", "utf8")
  assert.equal(/specialist|hidden bot|copywriter/i.test(source), false)
})

test("six helpers is the hard cap and a seventh stays queued", () => {
  assert.equal(specialists.MAX_CONCURRENT_SPECIALISTS, 6)
  assert.equal(specialists.SPECIALIST_ROLES.length, 6)
  const tasks = Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    role: "copywriter",
    brief: "draft",
    status: "queued",
    result: "",
  }))
  const first = specialists.claimQueued(tasks)
  assert.equal(first.length, 6)
  assert.equal(tasks.filter((task) => task.status === "queued").length, 2)
  assert.equal(specialists.claimQueued(tasks).length, 0)
  tasks[0].status = "done"
  assert.equal(specialists.claimQueued(tasks).length, 1)
})

test("work never runs more than six at once", async () => {
  let active = 0
  const items = Array.from({ length: 8 }, (_, index) => index)
  const peak = await specialists.runWithCap(items, 6, async () => {
    active += 1
    assert.ok(active <= 6)
    await new Promise((resolve) => setTimeout(resolve, 15))
    active -= 1
  })
  assert.ok(peak <= 6)
  assert.ok(peak >= 1)
})

test("a helper draft stays in Ava's voice and drops the banned line", () => {
  const draft = specialists.localSpecialistDraft("copywriter", "In the theater of life, we are all actors sharing the same scene. Write a page.")
  const spoken = specialists.presentAsAva([draft, "The copywriter bot finished."])
  assert.equal(/theater of life/i.test(spoken), false)
  assert.equal(/copywriter/i.test(spoken), false)
  assert.match(spoken, /Nothing has been sent/)
})

test("a helper cannot use a tool outside its job", () => {
  const ads = specialists.actionsFromCalls("ads", [
    { name: "create_contact", arguments: { name: "Pat" } },
    { name: "start_campaign", arguments: { name: "Spring note" } },
  ])
  assert.equal(ads.map((action) => action.type).join(","), "start_campaign")
  const social = specialists.actionsFromCalls("social", [
    { name: "draft_social_post", arguments: { platform: "instagram", body: "Hello from the shop." } },
    { name: "start_campaign", arguments: { name: "Nope" } },
  ])
  assert.equal(social.length, 1)
  assert.equal(social[0].type, "draft_social_post")
})

test("a plain request for a draft is handed to a helper", () => {
  assert.equal(specialists.jobsFromRequest("what are your ad services").length, 0)
  const jobs = specialists.jobsFromRequest("Please write a week of posts and a homepage outline")
  assert.equal(jobs.map((job) => job.role).sort().join(","), "seo,social")
})

test("a rejected office database key falls back to the owner sign-in", async () => {
  let probed = 0
  const choice = await deskAuth.chooseDeskHeaders({
    url: "https://sdjbvdujcmfmdjfolmhv.supabase.co",
    service: "sb_secret_not_this_project_000000",
    anon: "sb_publishable_public",
    ownerAccess: "owner-access-token",
    serviceState: "unknown",
    probe: async (headers) => {
      probed += 1
      assert.equal(headers.apikey.startsWith("sb_secret_"), true)
      assert.equal(headers.Authorization, undefined)
      return 401
    },
  })
  assert.equal(probed, 1)
  assert.equal(choice.rejectedService, true)
  assert.equal(choice.headers.Authorization, "Bearer owner-access-token")
  assert.equal(choice.headers.apikey, "sb_publishable_public")
})

test("a service key from another project is not sent", async () => {
  const other = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", Buffer.from(JSON.stringify({ role: "service_role", ref: "otherproject" })).toString("base64url"), "sig"].join(".")
  let probed = 0
  const choice = await deskAuth.chooseDeskHeaders({
    url: "https://sdjbvdujcmfmdjfolmhv.supabase.co",
    service: other,
    anon: "anon-key",
    ownerAccess: "owner-access-token",
    serviceState: "unknown",
    probe: async () => {
      probed += 1
      return 200
    },
  })
  assert.equal(probed, 0)
  assert.equal(choice.headers.Authorization, "Bearer owner-access-token")
})

test("helper rows are owner-only in the migration", () => {
  const sql = fs.readFileSync("supabase/migrations/20261113_specialist_tasks.sql", "utf8")
  assert.match(sql, /using \(public\.is_owner\(\)\)/)
  assert.match(sql, /revoke all on public\.specialist_tasks from public, anon, authenticated/)
  assert.match(sql, /grant execute on function public\.claim_specialist_tasks\(uuid, integer\) to service_role/)
  assert.equal(/to authenticated[\s\S]*for insert/i.test(sql), false)
})
