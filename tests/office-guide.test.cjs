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
  vm.runInNewContext(code, { exports: module.exports, module, require: () => { throw new Error(file) } })
  return module.exports
}

const guide = load("avaskye-online/src/lib/page-guide.ts")
const setup = load("avaskye-online/src/lib/setup-chat.ts")
const pub = load("avaskye-online/src/lib/public-chat.ts")

test("every office nav page has steps, and an unknown page still has a guide", () => {
  for (const href of ["/", "/crm", "/settings", "/clients", "/pipeline"]) {
    const page = guide.guideForPath(href)
    assert.ok(page.steps.length >= 2, href)
  }
  const crm = guide.guideForPath("/crm")
  assert.equal(crm.label, "CRM")
  assert.match(crm.steps.map((step) => step.detail).join(" "), /confirm/i)
  const other = guide.guideForPath("/not-a-page")
  assert.equal(other.label, "This page")
  assert.match(guide.answerAboutPage("what is this page?", "/crm"), /CRM/)
  assert.equal(guide.answerAboutPage("hello", "/crm"), null)
})

test("office setup answers a question, accepts a correction, and hands off to signup", () => {
  const history = []
  let reply = setup.officeSetupReply("set up my free account", history)
  assert.match(reply, /What should I call you\?/)
  history.push({ role: "assistant", content: reply }, { role: "user", content: "Sam" })
  reply = setup.officeSetupReply("why do you ask?", history)
  assert.match(reply, /Good question/)
  assert.match(reply, /What should I call you\?/)
  history.push({ role: "assistant", content: reply }, { role: "user", content: "Sam" })
  reply = setup.officeSetupReply("Sam", history)
  assert.match(reply, /What's the business called\?/)
  history.push({ role: "assistant", content: reply }, { role: "user", content: "Flow Hous" })
  reply = setup.officeSetupReply("Flow Hous", history)
  assert.match(reply, /What do you sell\?/)
  history.push({ role: "assistant", content: reply })
  reply = setup.officeSetupReply("actually the studio is called Flow Haus", history)
  assert.match(reply, /Flow Haus/)
  assert.match(reply, /What do you sell\?/)
  assert.equal(setup.officeSetupReply("open the pipeline", history), null)
})

test("a finished office setup recaps and does not pretend the desk created the login", () => {
  const answers = ["Sam", "Flow Haus", "bread", "neighbors", "I don't have one", "sam@example.com"]
  const history = []
  let reply = setup.officeSetupReply("help me start", history)
  for (const answer of answers) {
    history.push({ role: "assistant", content: reply }, { role: "user", content: answer })
    reply = setup.officeSetupReply(answer, history)
  }
  assert.match(reply, /Here's what I heard/)
  assert.match(reply, /Flow Haus/)
  assert.match(reply, /https:\/\/www\.digimark101\.com\/signup\?email=sam%40example\.com/)
  assert.match(reply, /does not create the login/)
  history.push({ role: "assistant", content: reply }, { role: "user", content: "yes" })
  const saved = setup.officeSetupReply("yes", history)
  assert.match(saved, /signup page is where the account is created/)
  assert.doesNotMatch(saved, /Saved\. Your setup/)
})

test("the public Ava chat cannot see the office and still points to signup", () => {
  assert.match(pub.scriptedPublicReply("show office records"), /signed-in desk/)
  assert.match(pub.scriptedPublicReply("where do I sign up?"), /https:\/\/www\.digimark101\.com\/signup/)
  assert.match(pub.scriptedPublicReply("what does it cost?"), /digimark101\.com\/pricing/)
  assert.match(pub.PUBLIC_MODEL_MISSING, /OPENAI_API_KEY/)
  assert.match(pub.PUBLIC_MODEL_MISSING, /did not make up/)
  const route = fs.readFileSync("avaskye-online/src/app/api/ava/public-chat/route.ts", "utf8")
  assert.match(route, /sameOrigin/)
  assert.equal(route.includes("deskSnapshot"), false)
  assert.equal(route.includes("/api/office"), false)
  const office = fs.readFileSync("avaskye-online/src/app/api/office/guide/route.ts", "utf8")
  assert.equal(office.includes("XAI_API_KEY"), false)
  assert.match(office, /officeSetupReply/)
  assert.match(office, /readOfficeOwner/)
})
