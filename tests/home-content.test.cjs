const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")
const { ImageConfigContext } = require("next/dist/shared/lib/image-config-context.shared-runtime")
const { imageConfigDefault } = require("next/dist/shared/lib/image-config")

// Render the real components, including their Link, Image, and speech controls.
// No Next server, environment credentials, or new test dependencies are required.
const cache = new Map()
function load(file) {
  const absolute = path.resolve(file)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }
  cache.set(absolute, module.exports)
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  function localRequire(id) {
    if (!id.startsWith("@/") && !id.startsWith(".")) return require(id)
    const base = id.startsWith("@/") ? path.resolve(id.slice(2)) : path.resolve(path.dirname(absolute), id)
    const resolved = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    if (!resolved) throw new Error(`Cannot resolve ${id}`)
    return load(resolved)
  }
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, process, URL, console })
  return module.exports
}

const { HomeHero } = load("components/home/home-hero.tsx")
const { HomeSections } = load("components/home/home-sections.tsx")
const { Header } = load("components/site/header.tsx")
const { Footer } = load("components/site/footer.tsx")
const { homeFaqs } = load("lib/home-content.ts")
const { services, packages } = load("lib/site.ts")
const { agencyPages } = load("lib/agency-pages.ts")
const render = (component) => renderToStaticMarkup(React.createElement(ImageConfigContext.Provider, { value: { ...imageConfigDefault, qualities: [70, 75] } }, React.createElement(component)))
const hero = render(HomeHero)
const sections = render(HomeSections)

function assertRouteExists(href) {
  const route = href.split(/[?#]/)[0]
  if (!route || !route.startsWith("/") || route === "/sitemap.xml") return
  if (fs.existsSync(path.join("public", route))) return
  if (route.startsWith("/agency/")) {
    assert.ok(agencyPages.some((page) => page.path === route), route)
    assert.ok(fs.existsSync("app/(marketing)/agency/[slug]/page.tsx"))
    return
  }
  if (route.startsWith("/services/")) {
    assert.ok(services.some((service) => route === `/services/${service.slug}`), route)
    assert.ok(fs.existsSync("app/(marketing)/services/[slug]/page.tsx"))
    return
  }
  assert.ok(["app/(marketing)", "app/(workspace)"].some((root) => fs.existsSync(path.join(root, route, "page.tsx"))), `Missing route: ${route}`)
}

test("the hero has one main heading and usable platform and agency paths", () => {
  assert.equal((hero.match(/<h1\b/g) || []).length, 1)
  assert.match(hero, /Build your own dynasty\./)
  assert.match(hero, /Own the system\. Grow it with Ava\./)
  for (const href of ["/beta", "/contact", "/studio"]) assert.match(hero, new RegExp(`href="${href}"`))
  assert.doesNotMatch(hero, /href="\/signup"/)
  const images = [...hero.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)]
  assert.equal(images.length, 1)
  assert.match(images[0][0], /alt="[^"]+"/)
  assert.ok(fs.existsSync("public/media/ava-city.jpg"))
})

test("Ava's introduction is opt-in and has a text alternative", () => {
  assert.match(hero, /<button[^>]*aria-pressed="false"/)
  assert.match(hero, /Play Ava Skye&#x27;s introduction/)
  assert.match(hero, /<summary[^>]*>Read the introduction<\/summary>/)
  assert.doesNotMatch(hero, /<audio|autoplay/i)
})

test("every FAQ answer used for structured data is visible in an expandable answer", () => {
  assert.equal((sections.match(/<details\b/g) || []).length, homeFaqs.length)
  for (const faq of homeFaqs) {
    const answer = renderToStaticMarkup(React.createElement("p", null, faq.answer)).slice(3, -4)
    assert.ok(sections.includes(answer), faq.question)
  }
})

test("all homepage sections have unique, linked accessible headings", () => {
  const ids = [...sections.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(new Set(ids).size, ids.length)
  for (const [, id] of sections.matchAll(/aria-labelledby="([^"]+)"/g)) {
    assert.ok(ids.includes(id), `Missing heading ${id}`)
    assert.match(sections, new RegExp(`<h2[^>]*id="${id}"`))
  }
})

test("services and proposals link to existing pages, with no dead placeholder links", () => {
  const markup = hero + sections + render(Header) + render(Footer)
  for (const [, href] of markup.matchAll(/href="([^"]+)"/g)) {
    assert.notEqual(href, "#")
    assertRouteExists(href)
  }
  for (const service of services) assert.ok(sections.includes(`href="/services/${service.slug}"`))
  for (const plan of packages) assert.ok(sections.includes(plan.priceLabel))
})

test("the beta overview keeps delivery limits and the earnings disclaimer visible", () => {
  assert.match(sections, /Page plans are not published sites/)
  assert.match(sections, /Sending, social publishing, and the visual page builder are not connected yet/)
  assert.match(render(Footer), /Income is not guaranteed/)
})
