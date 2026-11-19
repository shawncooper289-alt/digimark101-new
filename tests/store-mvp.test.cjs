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
  const context = {
    exports: module.exports,
    module,
    require: (id) => {
      if (id === "node:crypto") return require("node:crypto")
      throw new Error(id)
    },
    Buffer,
    Intl,
  }
  vm.runInNewContext(code, context)
  return module.exports
}

const catalog = load("lib/store/catalog.ts")
const hosts = load("lib/store/hosts.ts")
const token = load("lib/store/token.ts")
const leads = load("lib/store/leads.ts")
const parse = load("lib/store/paypal-parse.ts")
const anonymize = load("lib/surfaces/anonymize.ts")

test("the catalog is three fixed one-time products", () => {
  assert.equal(catalog.catalogProblems().length, 0)
  const kinds = catalog.STORE_PRODUCTS.map((product) => product.kind).sort().join(",")
  assert.equal(kinds, "credits,download,leads")
  const lead = catalog.STORE_PRODUCTS.find((product) => product.kind === "leads")
  assert.equal(catalog.LEAD_NICHE_KEYS.includes(lead.nicheKey), true)
  const pub = catalog.toPublicProduct(lead)
  assert.equal(pub.file, undefined)
  assert.equal(Object.hasOwn(pub, "file"), false)
})

test("the store host rewrites to /store and the agency host does not", () => {
  assert.equal(hosts.storeRewritePath("appdm101.store", "/"), "/store")
  assert.equal(hosts.storeRewritePath("www.appdm101.store:443", "/confirmation"), "/store/confirmation")
  assert.equal(hosts.storeRewritePath("appdm101.store", "/store"), null)
  assert.equal(hosts.storeRewritePath("appdm101.store", "/store/confirmation"), null)
  assert.equal(hosts.storeRewritePath("appdm101.store", "/api/store/orders"), null)
  assert.equal(hosts.storeRewritePath("appdm101.store", "/robots.txt"), null)
  assert.equal(hosts.storeRewritePath("www.digimark101.com", "/"), null)
  assert.equal(hosts.storeRewritePath("www.digimark101.com", "/pricing"), null)
  assert.equal(hosts.safeNextPath("/store/confirmation?order=1"), "/store/confirmation?order=1")
  assert.equal(hosts.safeNextPath("https://evil.example/store"), "/studio")
  assert.equal(hosts.safeNextPath("//evil.example"), "/studio")
  assert.equal(hosts.surfaceRewritePath("appdm101.online", "/seo"), "/leads/seo")
  assert.equal(hosts.surfaceRewritePath("appdm101.ink", "/"), "/offers")
  assert.equal(hosts.surfaceRewritePath("www.digimark101.com", "/leads"), null)
  assert.equal(hosts.safeNextPath("/leads/seo"), "/leads/seo")
  assert.equal(hosts.safeNextPath("/offers/welcome"), "/offers/welcome")
})

test("a delivery signature expires and rejects a tampered order", () => {
  const secret = "test-secret"
  const orderId = "11111111-1111-4111-8111-111111111111"
  const exp = 2_000_000_000
  const sig = token.signDelivery(orderId, exp, secret)
  assert.equal(token.deliverySigOk(orderId, exp, sig, secret, exp * 1000 - 1000), true)
  assert.equal(token.deliverySigOk(orderId, exp, sig, secret, exp * 1000 + 1000), false)
  assert.equal(token.deliverySigOk(orderId, exp, sig, "other", exp * 1000 - 1000), false)
  const path = token.confirmationPath(orderId, secret, 1_000)
  assert.equal(path.startsWith("/store/confirmation?"), true)
})

test("lead delivery keeps consent and drops a refused share", () => {
  const base = {
    premium: true,
    sellable: true,
    consentContact: true,
    consentShare: true,
    optedOut: false,
    suppressed: false,
    consentRowShare: null,
  }
  assert.equal(leads.leadIsDeliverable(base), true)
  assert.equal(leads.leadIsDeliverable({ ...base, consentRowShare: false }), false)
  assert.equal(leads.leadIsDeliverable({ ...base, consentShare: false }), false)
  assert.equal(leads.leadIsDeliverable({ ...base, optedOut: true }), false)
  assert.equal(leads.leadIsDeliverable({ ...base, sellable: false }), false)
  const csv = leads.leadsToCsv([
    { name: "A, B", email: "a@example.com", phone: "", company: "Co", region: "TX", companySize: "1-10", score: "80" },
  ])
  assert.match(csv, /^name,email,phone,company,region,company_size,score\n/)
  assert.match(csv, /"A, B"/)
  assert.equal(csv.includes("secret-note"), false)
  const sample = anonymize.anonymizedLead({ region: "TX", company_size: "1-10", score: 80, email: "a@example.com", phone: "555", full_name: "A" })
  assert.equal(sample.region, "TX")
  assert.equal(Object.hasOwn(sample, "email"), false)
  assert.equal(Object.hasOwn(sample, "phone"), false)
  assert.equal(Object.hasOwn(sample, "full_name"), false)
})

test("PayPal capture parsing reads the amount and ignores a bad value", () => {
  const parsed = parse.readCapture({
    id: "ORDER12345678",
    status: "COMPLETED",
    payer: { email_address: "Buyer@Example.com" },
    purchase_units: [
      {
        custom_id: "11111111-1111-4111-8111-111111111111",
        payments: { captures: [{ id: "CAP123456789", status: "COMPLETED", amount: { currency_code: "USD", value: "27.00" } }] },
      },
    ],
  })
  assert.equal(parsed.captureId, "CAP123456789")
  assert.equal(parsed.amountCents, 2700)
  assert.equal(parsed.email, "buyer@example.com")
  assert.equal(parsed.paypalOrderId, "ORDER12345678")
  assert.equal(parse.centsFromAmount("27.001"), null)
  assert.equal(parse.centsFromAmount("79.00"), 7900)
})
