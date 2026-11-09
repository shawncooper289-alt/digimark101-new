const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, imports, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (id) => imports[id], URL, URLSearchParams, AbortSignal, ...globals })
  return exports
}

test("customer exchanges a recovery token once and scrubs the URL", async () => {
  let calls = 0, cleared
  const { establishSessionFromUrl } = load("lib/auth/establish-session.ts", {
    "@/lib/supabase/browser": { createSupabaseBrowser: () => ({ auth: {
      verifyOtp: async (input) => { calls++; assert.equal(input.type, "recovery"); return { error: null } },
    } }) },
  }, { window: { location: { search: "?token_hash=one-time&type=recovery", hash: "", pathname: "/reset-password" }, history: { replaceState: (_a, _b, path) => { cleared = path } } } })
  const result = await establishSessionFromUrl()
  assert.equal(result.ok, true)
  assert.equal(result.type, "recovery")
  assert.equal(calls, 1)
  assert.equal(cleared, "/reset-password")
})

test("both callback effects run a one-time exchange only once under repeated effects", async () => {
  for (const office of [false, true]) {
    let effect, exchanges = 0, destination
    const router = { replace: (value) => { destination = value }, refresh() {} }
    const globals = {
      window: { location: { search: "?token_hash=one-time&type=magiclink", hash: "", pathname: "/auth/callback" }, history: { replaceState() {} } },
      fetch: async () => { exchanges++; return { ok: true } },
    }
    const imports = {
      react: { useRef: () => ({ current: false }), useState: (value) => [value, () => {}], useEffect: (fn) => { effect = fn } },
      "next/navigation": { useRouter: () => router },
      "next/link": { default: () => null },
      "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
      "@/lib/auth/establish-session": { safeNextPath: (_value, fallback) => fallback, establishSessionFromUrl: async () => { exchanges++; return { ok: true, type: "magiclink" } } },
    }
    const file = office ? "avaskye-online/src/app/auth/callback/page.tsx" : "app/auth/callback/page.tsx"
    load(file, imports, globals).default()
    effect()
    effect()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(exchanges, 1)
    assert.equal(destination, office ? "/" : "/studio")
  }
})

test("office token verification only sets a cookie for an authorized owner", async () => {
  for (const owner of [true, false]) {
    let cookieWrites = 0, requests = 0
    const imports = {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "next/headers": { cookies: async () => ({ set: () => { cookieWrites++ } }) },
      "@/lib/auth-fetch": { authFetch: async () => {
        requests++
        return requests === 1
          ? Response.json({ access_token: "test-access", refresh_token: "test-refresh" })
          : Response.json({ email: "test@example.com", app_metadata: { role: owner ? "owner" : "customer" } })
      } },
      "@/lib/office-store": {
        officeConfig: () => ({ url: "https://example.supabase.co", anon: "test", emails: ["owner@example.com"] }),
        isOwnerIdentity: (_email, role) => role === "owner", ownerEmails: () => [],
        encodeOfficeSession: () => "session", officeCookieOptions: () => ({}), supabaseKeyHeaders: () => ({}),
      },
    }
    const { POST } = load("avaskye-online/src/app/api/office/session/verify/route.ts", imports)
    const response = await POST(new Request("https://www.avaskye.online/api/office/session/verify", {
      method: "POST", body: JSON.stringify({ token_hash: "one-time", type: "magiclink" }),
    }))
    assert.equal(response.status, owner ? 200 : 403)
    assert.equal(cookieWrites, owner ? 1 : 0)
  }
})

test("office callback scrubs rejected link details without exposing provider text", async () => {
  let effect, status, cleared
  const imports = {
    react: { useRef: () => ({ current: false }), useState: (value) => [value, (next) => { status = next }], useEffect: (fn) => { effect = fn } },
    "next/navigation": { useRouter: () => ({ replace() {}, refresh() {} }) },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
  }
  load("avaskye-online/src/app/auth/callback/page.tsx", imports, {
    window: { location: { search: "?error_description=private-provider-detail", hash: "" }, history: { replaceState: (_a, _b, path) => { cleared = path } } },
  }).default()
  effect()
  await new Promise((resolve) => setTimeout(resolve, 0))
  assert.equal(cleared, "/auth/callback")
  assert.match(status, /rejected/)
  assert.doesNotMatch(status, /private-provider-detail/)
})

test("office seat grants send a canonical customer invitation via the REST redirect parameter", async () => {
  const calls = []
  const { grantSeat } = load("avaskye-online/src/lib/grant-seat.ts", {
    "@/lib/office-store": {
      officeConfig: () => ({ url: "https://example.supabase.co", service: "test-only" }),
      supabaseKeyHeaders: () => ({}),
    },
  }, {
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://preview.example.com" } },
    fetch: async (url, options) => {
      calls.push({ url: String(url), options })
      if (String(url).includes("/rpc/deliver_seat")) return Response.json({ ok: true, seat_id: "seat" })
      return Response.json({})
    },
  })
  const result = await grantSeat({ email: "tester@example.com", planKey: "monthly", grantedBy: "owner" })
  assert.equal(result.invited, true)
  const invite = calls.find((call) => call.url.includes("/auth/v1/otp"))
  assert.equal(new URL(invite.url).searchParams.get("redirect_to"), "https://www.digimark101.com/auth/callback")
  assert.equal(JSON.parse(invite.options.body).options, undefined)
  assert.ok(invite.options.signal)
})
