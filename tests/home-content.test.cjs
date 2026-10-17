const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

const read = path => fs.readFileSync(path, "utf8")
const siteCode = ts.transpileModule(read("lib/site.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const site = {}
vm.runInNewContext(siteCode, { exports: site, process: { env: {} } })

test("homepage explains the method and removes unsubstantiated work labels", () => {
  const home = read("components/home/home-page.tsx")
  assert.match(home, /step\.idea/)
  assert.match(home, /step\.how/)
  assert.match(home, /step\.why/)
  assert.match(home, /pkg\.why/)
  assert.match(home, /No client results\s+are published here yet/)
  assert.doesNotMatch(home, /PlaceholderNote|Sample only|structural examples/i)
})

test("work pages describe process and preserve result-approval transparency", () => {
  const workIndex = read("app/work/page.tsx")
  const workDetail = read("app/work/[slug]/page.tsx")
  const terms = read("app/terms/page.tsx")
  const forbidden = /PlaceholderNote|Sample only|structural examples|not a story we delivered|labeled placeholders/i

  for (const content of [workIndex, workDetail, terms]) assert.doesNotMatch(content, forbidden)
  assert.match(workIndex, /No client results are published here yet/)
  assert.match(terms, /partner approves the facts and context/)
  assert.match(workDetail, /What the readout tracks/)
})

test("case-study walkthroughs and packages describe process rather than invented outcomes", () => {
  assert.equal(site.caseStudies.length, 3)
  for (const study of site.caseStudies) {
    assert.ok(study.summary.length > 0)
    assert.ok(study.approach.length >= 3)
    assert.ok(study.wouldMeasure.length >= 2)
    assert.doesNotMatch(`${study.summary} ${study.situation} ${study.approach.join(" ")}`, /placeholder|sample only|not a result|not a story/i)
  }
  assert.ok(site.packages.every(pkg => pkg.why.length > 0))
})

test("method describes the channel sequence and publishes results only with approval", () => {
  const channelSequence = site.method[1].how
  const channels = ["warm outreach", "useful public content", "targeted cold outreach", "paid distribution"]
  assert.deepEqual([...channels].sort((a, b) => channelSequence.indexOf(a) - channelSequence.indexOf(b)), channels)
  assert.ok(site.method.every(step => step.idea && step.how && step.why))
  assert.match(site.homeFaqs.find(faq => faq.question === "Do you publish client results?").answer, /No client results are published here yet/)
  assert.match(site.homeFaqs.find(faq => faq.question === "Do you publish client results?").answer, /partner approves/)
})

test("Ava describes the work accurately and does not invent proof", () => {
  const ava = read("lib/ava/respond.ts")
  assert.match(ava, /none are published on this site yet/)
  assert.match(ava, /Approach:.*Measures:/)
  assert.doesNotMatch(ava, /work pages are labeled placeholders|placeholder only/i)
})
