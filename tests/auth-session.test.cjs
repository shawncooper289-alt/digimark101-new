const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, imports, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, {
    exports: module.exports, module,
    require: (id) => { if (!(id in imports)) throw new Error(id); return imports[id] },
    ...globals,
  })
  return module.exports
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10))

function providerHarness(fetchImpl) {
  const state = [], refs = [], effects = [], timers = new Set()
  let cursor = 0, refCursor = 0, mounted = false, authCallback, unsubscribed = false
  const storage = { getItem: () => null, setItem() {}, removeItem() {} }
  const window = {
    location: { search: "" }, addEventListener() {}, removeEventListener() {},
    setTimeout(fn, ms) { const id = setTimeout(fn, ms); timers.add(id); return id },
    clearTimeout,
  }
  const { PlatformProvider } = load("components/studio/platform-provider.tsx", {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial; return [state[i], (value) => { state[i] = typeof value === "function" ? value(state[i]) : value }] },
      useRef(initial) { const i = refCursor++; return refs[i] ||= { current: initial } },
      useCallback: (fn) => fn, useMemo: (fn) => fn(),
      useEffect(fn) { if (!mounted) effects.push(fn) },
    },
    "react/jsx-runtime": { jsx: (_type, props) => props },
    "@/lib/platform/reduce": { applyAction() { throw new Error("not used") } },
    "@/lib/platform/types": { emptyWorkspace: () => ({ contacts: [] }) },
    "@/lib/supabase/browser": { createSupabaseBrowser: () => ({ auth: {
      onAuthStateChange(callback) { authCallback = callback; return { data: { subscription: { unsubscribe() { unsubscribed = true } } } } },
    } }) },
  }, { window, localStorage: storage, sessionStorage: storage, URLSearchParams, fetch: fetchImpl })
  function render() { cursor = 0; refCursor = 0; return PlatformProvider({ children: null }).value }
  render()
  const cleanups = effects.map((fn) => fn())
  mounted = true
  return {
    render,
    emit(event) { assert.equal(typeof authCallback, "function", "workspace must subscribe to session changes"); authCallback(event, event === "SIGNED_OUT" ? null : { user: { id: "test-user" } }) },
    close() { cleanups.forEach((fn) => fn?.()); timers.forEach(clearTimeout) },
    get unsubscribed() { return unsubscribed },
  }
}

const preview = { mode: "preview", configured: true }
const account = { mode: "account", configured: true, email: "owner@example.com", isOwner: true, workspace: { contacts: [{ id: "private" }] } }

test("sign-in reloads the account and owner state without a hard reload; sign-out clears it", async () => {
  let result = preview
  const h = providerHarness(async () => ({ json: async () => result }))
  try {
    await tick()
    assert.equal(h.render().mode, "preview")
    result = account
    h.emit("SIGNED_IN")
    await tick()
    assert.equal(h.render().mode, "account")
    assert.equal(h.render().isOwner, true)
    assert.equal(h.render().workspace.contacts[0].id, "private")
    result = preview
    h.emit("SIGNED_OUT")
    await tick()
    assert.equal(h.render().mode, "preview")
    assert.equal(h.render().workspace.contacts.length, 0)
    assert.equal(h.render().isOwner, false)
  } finally { h.close() }
  assert.equal(h.unsubscribed, true)
})

test("a slow signed-out request cannot overwrite a newer signed-in workspace", async () => {
  let resolveFirst, calls = 0
  const h = providerHarness(async () => {
    calls++
    return { json: () => calls === 1 ? new Promise((resolve) => { resolveFirst = resolve }) : Promise.resolve(account) }
  })
  try {
    await tick()
    h.emit("SIGNED_IN")
    await tick()
    assert.equal(h.render().mode, "account")
    resolveFirst(preview)
    await tick()
    assert.equal(h.render().mode, "account")
  } finally { h.close() }
})

test("studio invites send the return URL as redirect_to, not an ignored SDK options body", async () => {
  let sent
  const { sendStudioInvite } = load("lib/seats/deliver.ts", {
    "@/lib/supabase/admin": { createSupabaseAdmin: () => null },
    "@/lib/supabase/headers": { supabaseKeyHeaders: () => ({}) },
  }, {
    process: { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only", NEXT_PUBLIC_SITE_URL: "https://studio.example.com" } },
    URL,
    fetch: async (url, options) => { sent = { url: new URL(url), body: JSON.parse(options.body) }; return { ok: true } },
  })
  assert.equal(await sendStudioInvite("tester@example.com"), true)
  assert.equal(sent.url.searchParams.get("redirect_to"), "https://studio.example.com/auth/callback")
  assert.equal(sent.body.email, "tester@example.com")
  assert.equal(sent.body.options, undefined)
  await sendStudioInvite("tester@example.com", "https://studio.example.com/auth/callback?next=/start")
  assert.equal(sent.url.searchParams.get("redirect_to"), "https://studio.example.com/auth/callback?next=/start")
})

test("the shared browser client leaves one-time URL exchange to the callback handler", () => {
  let options
  const { createSupabaseBrowser } = load("lib/supabase/browser.ts", {
    "@supabase/ssr": { createBrowserClient: (_url, _key, opts) => { options = opts; return {} } },
    "@/lib/supabase/config": { supabasePublicConfig: () => ({ url: "https://example.supabase.co", key: "test-only" }) },
  })
  createSupabaseBrowser()
  assert.equal(options.auth.detectSessionInUrl, false)
})
