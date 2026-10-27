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
const playbook = load("lib/ava/onboarding-playbook.ts", (id) => {
  if (String(id).includes("site")) return { site: { url: "https://www.digimark101.com", email: "hi@digimark101.com" } }
  if (String(id).includes("fields")) return fields
  throw new Error(id)
})
const { setupReply, setupResult, ACCOUNT_SETUP_QUESTIONS: Q } = (() => {
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
  assert.equal(reply.includes("What days and hours can people book?"), false)
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
  assert.equal(result.outcomes.some((item) => "value" in item || "answer" in item), false)
  assert.equal(result.outcomes[0].outcome, "completed")
  assert.equal(result.outcomes[0].questionId, "confirm")
  assert.equal(result.outcomes[0].niche, "local_service")
})

test("a known website is skipped", () => {
  const { reply } = run(
    ["Sam", "Flow Haus", "coaching", "a course for $50", "online buyers", "first sale", "email"],
    { business_website: "https://example.com" },
  )
  assert.equal(reply.includes("What is the website or domain?"), false)
  assert.ok(reply.includes("Which social pages"))
})
