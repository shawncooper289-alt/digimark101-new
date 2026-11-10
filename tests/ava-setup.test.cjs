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
  vm.runInNewContext(code, { exports: module.exports, module, require: requireImpl })
  return module.exports
}

const fields = load("lib/onboarding/fields.ts", () => {
  throw new Error("fields.ts has no imports")
})
const growth = load("lib/onboarding/growth-plan.ts", () => {
  throw new Error("growth-plan.ts has no imports")
})
const playbook = load("lib/ava/onboarding-playbook.ts", (id) => {
  if (String(id).includes("site")) return { site: { url: "https://www.digimark101.com", email: "hi@digimark101.com" } }
  if (String(id).includes("fields")) return fields
  if (String(id).includes("growth-plan")) return growth
  throw new Error(id)
})
const { setupReply, setupResult, accountSetupBrief, playbookGuide, ACCOUNT_SETUP_QUESTIONS: Q } = (() => {
  const account = load("lib/ava/account-setup.ts", (id) => {
    if (String(id).includes("onboarding-playbook")) return playbook
    throw new Error(id)
  })
  return { ...playbook, ...account }
})()

function run(answers, known = {}) {
  const turns = [{ role: "user", content: "set up my account" }]
  let reply = setupReply(turns, known)
  for (const answer of answers) {
    turns.push({ role: "assistant", content: reply }, { role: "user", content: answer })
    reply = setupReply(turns, known)
  }
  return { turns, reply }
}

test("a correction updates the earlier answer and repeats the open question", () => {
  const { reply } = run(["Sam", "Flow Hous", "actually the studio is called Flow Haus"])
  assert.match(reply, /Flow Haus/)
  assert.ok(reply.includes(Q[2].ask))
})

test("a question is answered without being saved as the answer", () => {
  const { reply } = run(["Sam", "why do you ask?"])
  assert.ok(reply.includes(Q[1].ask))
})

test("an explicit task exits the setup flow", () => {
  assert.equal(run(["Sam", "create a campaign for my yoga class"]).reply, null)
})

test("ecommerce skips the service-area question and ends on a confirm step", () => {
  const answers = [
    "Sam",
    "Flow Haus",
    "online store",
    "United States",
    "a mug for $18",
    "online buyers",
    "first sale",
    "I don't have one",
    "none",
    "none",
    "none",
    "no logo yet",
    "referrals",
    "email only with consent",
    "sam@example.com",
  ]
  const { reply } = run(answers)
  assert.match(reply, /Say yes to save these on your account/)
  assert.match(reply, /Flow Haus/)
  assert.ok(reply.includes("https://www.digimark101.com/signup?email=sam%40example.com"))
  assert.equal(reply.includes(Q.find((item) => item.id === "booking_hours").ask), false)
})

test("yes after the recap returns fields and does not log the answer text", () => {
  const answers = [
    "Sam",
    "Flow Haus",
    "home services",
    "Austin",
    "a visit for $90",
    "local homeowners",
    "booked calls",
    "I don't have one",
    "a calendar",
    "none",
    "none",
    "black and white",
    "weekdays 9 to 5",
    "referrals",
    "email only with consent",
    "sam@example.com",
    "yes",
  ]
  const turns = [{ role: "user", content: "set up my account" }]
  let result = setupResult(turns)
  for (const answer of answers) {
    turns.push({ role: "assistant", content: result.text }, { role: "user", content: answer })
    result = setupResult(turns)
  }
  assert.match(result.text, /Saved/)
  assert.equal(result.save.business_name, "Flow Haus")
  assert.equal(result.save.service_area, "Austin")
  assert.equal(result.save.booking_hours, "weekdays 9 to 5")
  assert.equal(result.save.main_roadblock, "No main roadblock yet; Ava will help find one")
  assert.match(result.save.growth_plan, /booked calls/)
  assert.equal(/bottleneck/i.test(`${result.text}\n${result.save.growth_plan}`), false)
  assert.equal(result.outcomes.some((item) => "value" in item || "answer" in item), false)
  assert.equal(result.outcomes[0].outcome, "completed")
  assert.equal(result.outcomes[0].questionId, "confirm")
  assert.equal(result.outcomes[0].niche, "local_service")
})

test("a known website is skipped", () => {
  const { reply } = run(
    ["Sam", "Flow Haus", "coaching", "a course for $50", "online buyers", "first sale", "not enough people know about us", "email"],
    { business_website: "https://example.com" },
  )
  const website = Q.find((item) => item.id === "website")
  const socials = Q.find((item) => item.id === "socials")
  assert.equal(reply.includes(website.ask), false)
  assert.ok(reply.includes(socials.ask))
})

test("a place said with the work is not asked again", () => {
  const { reply } = run(["Sam", "Northline", "I'm a roofer in Austin"])
  assert.match(reply, /roofer/i)
  assert.match(reply, /Austin/)
  assert.equal(reply.includes(Q.find((item) => item.id === "service_area").ask), false)
  assert.ok(reply.includes(Q.find((item) => item.id === "offer").ask))
})

test("saying there is no website skips that question", () => {
  const { reply } = run([
    "Sam",
    "Flow Haus",
    "coaching",
    "a course for $50",
    "online buyers",
    "first sale",
    "I don't know",
    "I don't have a website",
  ])
  assert.equal(reply.includes(Q.find((item) => item.id === "website").ask), false)
  assert.ok(reply.includes(Q.find((item) => item.id === "socials").ask))
})

test("no roadblock gets a warm reply and a plan from the goal", () => {
  const { reply } = run(["Sam", "Flow Haus", "a bakery", "Austin", "bread for $6", "neighbors", "more Saturday sales", "I don't have one"])
  assert.match(reply, /completely fine/i)
  assert.match(reply, /more Saturday sales|goal you named/i)
})

test("form answers are kept when the conversation continues", () => {
  const turns = [{ role: "user", content: "set up my account" }]
  const draft = { answers: { name: "Sam", business_name: "Flow House" } }
  const opened = setupResult(turns, {}, draft)
  assert.equal(opened.text.includes(Q.find((item) => item.id === "name").ask), false)
  assert.equal(opened.text.includes(Q.find((item) => item.id === "business_name").ask), false)
  assert.ok(opened.text.includes(Q.find((item) => item.id === "niche").ask))
  turns.push({ role: "assistant", content: opened.text }, { role: "user", content: "a bakery" })
  const next = setupResult(turns, {}, draft)
  assert.match(next.text, /bakery/i)
  assert.equal(next.setup.answers.business_name, "Flow House")
})

test("an edited form answer wins when they confirm", () => {
  const answers = [
    "Sam",
    "Flow Haus",
    "online store",
    "United States",
    "a mug for $18",
    "online buyers",
    "first sale",
    "I don't have one",
    "none",
    "none",
    "none",
    "no logo yet",
    "referrals",
    "email only with consent",
    "sam@example.com",
  ]
  const turns = [{ role: "user", content: "set up my account" }]
  let result = setupResult(turns)
  for (const answer of answers) {
    turns.push({ role: "assistant", content: result.text }, { role: "user", content: answer })
    result = setupResult(turns)
  }
  assert.match(result.text, /Say yes to save these on your account/)
  turns.push({ role: "assistant", content: result.text }, { role: "user", content: "yes" })
  const saved = setupResult(turns, {}, { answers: { business_name: "Flow House" }, planEdited: true, plan: "Start with the Saturday loaf." })
  assert.equal(saved.save.business_name, "Flow House")
  assert.equal(saved.save.growth_plan, "Start with the Saturday loaf.")
})

test("setup copy does not say bottleneck", () => {
  const sample = growth.starterGrowthPlan({ business: "Flow Haus", goal: "more calls", roadblock: growth.NO_ROADBLOCK_NOTE })
  const blob = [accountSetupBrief(), playbookGuide(), sample, ...Q.map((item) => `${item.ask} ${item.suggestions.join(" ")}`)].join("\n")
  assert.equal(/bottleneck/i.test(blob), false)
})
