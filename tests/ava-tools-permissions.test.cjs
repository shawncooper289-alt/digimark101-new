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

const registry = load("lib/ava/tools/registry.ts", (id) => {
  throw new Error(id)
})
const permissions = load("lib/ava/tools/permissions.ts", (id) => {
  if (String(id).includes("registry")) return registry
  throw new Error(id)
})
const page = load("lib/ava/tools/page.ts", (id) => {
  throw new Error(id)
})
const args = load("lib/ava/tools/args.ts", (id) => {
  throw new Error(id)
})
const desks = load("lib/modules/desk.ts", (id) => {
  throw new Error(id)
})

const member = { role: "member", confirmed: false, workspaceMatch: true, isPlatformOwner: false }
const admin = { role: "admin", confirmed: false, workspaceMatch: true, isPlatformOwner: false }
const owner = { role: "owner", confirmed: false, workspaceMatch: true, isPlatformOwner: false }

test("every tool has one api name and a page", () => {
  const names = new Set()
  for (const tool of registry.AVA_TOOLS) {
    assert.equal(names.has(tool.apiName), false, tool.apiName)
    names.add(tool.apiName)
    assert.equal(tool.apiName.includes("."), false)
    assert.ok(tool.page.startsWith("/"))
    assert.equal(registry.toolByName(tool.name).name, tool.name)
    assert.equal(registry.toolByApiName(tool.apiName).name, tool.name)
  }
  assert.ok(registry.AVA_TOOLS.length >= 40)
})

test("a guest cannot read or write, and a stranger workspace is refused", () => {
  const guest = permissions.authorize("contacts.list", { ...member, role: "guest" })
  assert.equal(guest.allow, false)
  const outside = permissions.authorize("contacts.create", { ...owner, workspaceMatch: false })
  assert.equal(outside.allow, false)
  assert.match(outside.reason, /outside your account/i)
})

test("a member can read and save, and cannot delete, send, or charge", () => {
  assert.equal(permissions.authorize("contacts.list", member).allow, true)
  assert.equal(permissions.authorize("contacts.create", member).needsConfirmation, false)
  assert.equal(permissions.authorize("deals.move", member).allow, true)
  for (const name of ["contacts.delete", "inbox.send", "campaigns.send", "social.publish", "reviews.request", "invoices.void", "invoices.request_payment"]) {
    const refused = permissions.authorize(name, { ...member, confirmed: true })
    assert.equal(refused.allow, false, name)
  }
})

test("destructive and outbound tools wait for confirmation, including for the owner", () => {
  for (const tool of registry.AVA_TOOLS) {
    if (tool.effect !== "destructive" && tool.effect !== "outbound") continue
    const pending = permissions.authorize(tool.name, { ...owner, isPlatformOwner: tool.scope === "platform_owner" })
    assert.equal(pending.allow, true, tool.name)
    assert.equal(pending.needsConfirmation, true, tool.name)
    const ready = permissions.authorize(tool.name, { ...owner, confirmed: true, isPlatformOwner: tool.scope === "platform_owner" })
    assert.equal(ready.needsConfirmation, false, tool.name)
  }
})

test("an admin can delete after confirmation and cannot request payment", () => {
  assert.equal(permissions.authorize("contacts.delete", admin).needsConfirmation, true)
  assert.equal(permissions.authorize("contacts.delete", { ...admin, confirmed: true }).allow, true)
  assert.equal(permissions.authorize("invoices.request_payment", { ...admin, confirmed: true }).allow, false)
  const copy = permissions.confirmationCopy("invoices.request_payment")
  assert.match(copy, /does not charge/i)
  assert.match(copy, /PayPal/i)
  assert.match(permissions.confirmationCopy("inbox.send"), /not delivered/i)
})

test("office records stay with the platform owner", () => {
  assert.equal(permissions.authorize("office.list", { ...owner, confirmed: true }).allow, false)
  assert.equal(permissions.authorize("office.create", { ...owner, confirmed: true, isPlatformOwner: true }).allow, true)
})

test("page context does not change a permission", () => {
  const screen = page.parsePageContext({
    path: "/studio/invoices",
    module: "invoices",
    title: "Invoices",
    visible: [{ type: "invoices", id: "1", label: "Open invoice" }],
  })
  assert.equal(screen.module, "invoices")
  assert.equal(page.moduleFromPath("/studio/forms"), "forms")
  const answer = page.answerFromPage("what is on this page?", screen)
  assert.match(answer, /Invoices/)
  assert.match(answer, /does not charge/)
  const again = permissions.authorize("invoices.request_payment", member)
  assert.equal(again.allow, false)
  assert.equal(permissions.resolveRole({ signedIn: false, isDataOwner: false, isPlatformOwner: false, membership: null }), "guest")
  assert.equal(permissions.resolveRole({ signedIn: true, isDataOwner: true, isPlatformOwner: false, membership: "member" }), "owner")
  assert.equal(permissions.resolveRole({ signedIn: true, isDataOwner: false, isPlatformOwner: false, membership: "admin" }), "admin")
})

test("an unknown tool is refused", () => {
  assert.equal(permissions.authorize("paypal.charge", { ...owner, confirmed: true }).allow, false)
})

test("company is kept and a card field is dropped", () => {
  assert.equal(args.sensitiveKey("company"), false)
  assert.equal(args.sensitiveKey("companyName"), false)
  assert.equal(args.sensitiveKey("pan"), true)
  assert.equal(args.sensitiveKey("cardNumber"), true)
  assert.equal(args.sensitiveKey("password"), true)
})

test("selects submit their visible default", () => {
  assert.equal(desks.fieldDefaults(desks.DESKS.inbox).channel, "sms")
  assert.equal(desks.fieldDefaults(desks.DESKS.workflows).trigger, "contact.created")
  assert.equal(desks.fieldDefaults(desks.DESKS.workflows).action, "log_inbox")
  assert.equal(desks.fieldDefaults(desks.DESKS.social).platform, "facebook")
})
