const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")

const content = fs.readFileSync("lib/home-content.ts", "utf8")
const hero = fs.readFileSync("components/home/home-hero.tsx", "utf8")
const sections = fs.readFileSync("components/home/home-sections.tsx", "utf8")
const about = fs.readFileSync("app/about/page.tsx", "utf8")
const footer = fs.readFileSync("components/site/footer.tsx", "utf8")
const marketing = `${content}\n${hero}\n${sections}\n${about}\n${footer}`

test("the hero keeps the dynasty, ownership, and Ava", () => {
  assert.match(content, /Build your own dynasty\./)
  assert.match(content, /Own the system\. Grow it with Ava\./)
  assert.match(hero, /hero\.lead/)
  assert.match(hero, /hero\.accent/)
  assert.match(hero, /ava-city\.jpg/)
  assert.match(hero, /Hear Ava|AvaIntroButton/)
})

test("the page names the audiences and the real product surface", () => {
  for (const name of ["Beginners", "Side hustlers", "Creators", "Local businesses", "Agencies"]) {
    assert.match(content, new RegExp(name))
  }
  for (const name of [
    "Ava Skye",
    "Contacts",
    "Pipeline",
    "Automations",
    "Email",
    "Funnels and websites",
    "Leads engine",
    "Studio",
    "White-label backend",
    "Beta",
    "SEO",
  ]) {
    assert.match(content, new RegExp(name))
  }
  assert.match(sections, /id="what"/)
  assert.match(sections, /id="who"/)
  assert.match(sections, /id="earn"/)
  assert.match(sections, /id="how"/)
  assert.match(sections, /id="features"/)
  assert.match(sections, /id="disciplines"/)
  assert.match(sections, /id="why"/)
  assert.match(sections, /id="compare"/)
  assert.match(sections, /id="faq"/)
})

test("money language stays honest", () => {
  assert.match(content, /Income is not guaranteed/)
  assert.match(footer, /earningsDisclaimer/)
  assert.doesNotMatch(content, /\$\d/)
  assert.doesNotMatch(content, /\b(testimonial|award|customers served|guaranteed income)\b/i)
  assert.match(content, /GoHighLevel/)
  assert.match(content, /does not send it|Sending starts/)
})

test("beginner-facing marketing copy avoids bottleneck", () => {
  assert.doesNotMatch(marketing, /bottleneck/i)
})
