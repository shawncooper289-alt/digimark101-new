const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

function load(file, mocks) {
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(code, {
    exports: module.exports,
    module,
    require(id) {
      if (id in mocks) return mocks[id]
      if (id === "react/jsx-runtime") return require(id)
      throw new Error(`Unexpected import: ${id}`)
    },
  })
  return module.exports
}

const widget = () => React.createElement("button", null, "Open Ava assistant")
const provider = ({ children }) => React.createElement(React.Fragment, null, children)

test("public marketing pages render content without loading the floating assistant", async () => {
  const { default: MarketingLayout } = load("app/(marketing)/layout.tsx", {
    "@/components/site/header": { Header: () => React.createElement("header", null, "Site navigation") },
    "@/components/site/footer": { Footer: () => React.createElement("footer", null, "Site footer") },
    "@/lib/partners": { partnerLinks: async () => [] },
    // Deliberately no AvaOnPage mock: public pages must not import the widget.
  })
  const html = renderToStaticMarkup(await MarketingLayout({ children: React.createElement("h1", null, "Landing page") }))
  assert.match(html, /Site navigation/)
  assert.match(html, /Landing page/)
  assert.match(html, /Site footer/)
  assert.doesNotMatch(html, /Open Ava assistant/)
})

test("the Studio keeps its floating assistant inside the workspace provider", () => {
  const { default: StudioLayout } = load("app/(workspace)/studio/layout.tsx", {
    "@/components/ava/ava-widget": { AvaWidget: widget },
    "@/components/studio/shell": { StudioShell: provider },
    "@/components/studio/platform-provider": { PlatformProvider: provider },
  })
  const html = renderToStaticMarkup(React.createElement(StudioLayout, null, "Studio workspace"))
  assert.match(html, /Studio workspace/)
  assert.equal((html.match(/Open Ava assistant/g) || []).length, 1)
})

test("Ava's shared profile uses the extracted all-black-outfit photo", () => {
  const { AvaAvatar } = load("components/branding/ava-avatar.tsx", {
    "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  })
  const html = renderToStaticMarkup(React.createElement(AvaAvatar, { size: "xl", showOnlineIndicator: true }))
  assert.match(html, /src="\/media\/ava-black-outfit\.jpg"/)
  assert.match(html, /Ava Skye/)
  assert.ok(fs.statSync("public/media/ava-black-outfit.jpg").size > 0)
})
