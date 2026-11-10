const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function load(file, imports = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require: (id) => {
      if (!(id in imports)) throw new Error(`missing mock ${id}`)
      return imports[id]
    },
    URL,
    URLSearchParams,
    AbortSignal,
    ...globals,
  })
  return exports
}

test("customer confirmation and recovery stay on the public domain in production", () => {
  const urls = load("lib/auth/site-url.ts", {}, {
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://holding.vercel.app" } },
  })
  assert.equal(urls.authCallbackUrl(), "https://www.digimark101.com/auth/callback")
  assert.equal(urls.resetPasswordUrl(), "https://www.digimark101.com/reset-password")
})

test("local development may use localhost for customer email links", () => {
  const urls = load("lib/auth/site-url.ts", {}, {
    process: { env: { NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" } },
  })
  assert.equal(urls.authCallbackUrl(), "http://localhost:3000/auth/callback")
})

test("office emails and password reset never follow a preview or forwarded host", () => {
  const urls = load("avaskye-online/src/lib/office-redirect.ts", {}, {
    process: { env: { NODE_ENV: "production", OFFICE_PUBLIC_URL: "https://holding.vercel.app" } },
  })
  for (const host of ["holding.vercel.app", "attacker.example", "www.avaskye.online", "localhost"]) {
    const request = new Request(`https://${host}/api/office/magic`, { headers: { "x-forwarded-host": "attacker.example" } })
    assert.equal(urls.officeCallbackUrl(request), "https://www.avaskye.online/auth/callback")
    assert.equal(urls.officeResetUrl(request), "https://www.avaskye.online/reset-password")
  }
})

test("Supabase config allows the exact production email destinations used by both apps", () => {
  const config = fs.readFileSync("supabase/config.toml", "utf8")
  const redirectList = config.match(/^additional_redirect_urls\s*=\s*\[([^\]]*)\]/m)
  assert.ok(redirectList, "Auth redirect allowlist must be configured")
  const allowed = new Set([...redirectList[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]))
  for (const origin of ["https://www.digimark101.com", "https://www.avaskye.online"]) {
    for (const path of ["/auth/callback", "/reset-password"]) {
      assert.ok(allowed.has(`${origin}${path}`), `missing exact redirect ${origin}${path}`)
    }
  }
  assert.match(config, /^site_url = "https:\/\/www\.digimark101\.com"$/m)
})

test("supabase email rate limit becomes a clear office message", async () => {
  const { readAuthError } = load("avaskye-online/src/lib/auth-failure.ts")
  const response = new Response(JSON.stringify({
    code: 429,
    error_code: "over_email_send_rate_limit",
    msg: "email rate limit exceeded",
  }), { status: 429 })
  const failure = await readAuthError(response)
  assert.equal(failure.status, 429)
  assert.match(failure.error, /Too many emails were sent/)
  assert.equal(failure.error.includes("email rate limit exceeded"), false)
})

test("auth requests have a deadline and never cache credentials", async () => {
  let options
  const auth = load("avaskye-online/src/lib/auth-fetch.ts", {}, {
    AbortSignal,
    Response,
    fetch: async (_url, init) => {
      options = init
      return Response.json({})
    },
  })
  await auth.authFetch("https://provider.example", { method: "POST" })
  assert.equal(options.cache, "no-store")
  assert.ok(options.signal)
})

test("studio invites send redirect_to on the public customer callback", async () => {
  let sent
  const { sendStudioInvite } = load("lib/seats/deliver.ts", {
    "@/lib/auth/site-url": { publicSiteOrigin: () => "https://www.digimark101.com" },
    "@/lib/supabase/admin": { createSupabaseAdmin: () => null },
    "@/lib/supabase/headers": { supabaseKeyHeaders: () => ({}) },
  }, {
    process: { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "test-only", NODE_ENV: "production" } },
    fetch: async (url, options) => {
      sent = { url: new URL(url), body: JSON.parse(options.body) }
      return { ok: true }
    },
  })
  assert.equal(await sendStudioInvite("tester@example.com", "https://evil.example/auth/callback"), true)
  assert.equal(sent.url.searchParams.get("redirect_to"), "https://www.digimark101.com/auth/callback")
  assert.equal(sent.body.options, undefined)
  await sendStudioInvite("tester@example.com", "https://www.digimark101.com/auth/callback?next=/start")
  assert.equal(sent.url.searchParams.get("redirect_to"), "https://www.digimark101.com/auth/callback?next=/start")
})

test("the shared browser client leaves one-time URL exchange to the callback", () => {
  let options
  const { createSupabaseBrowser } = load("lib/supabase/browser.ts", {
    "@supabase/ssr": { createBrowserClient: (_url, _key, opts) => { options = opts; return {} } },
    "@/lib/supabase/config": { supabasePublicConfig: () => ({ url: "https://example.supabase.co", key: "test-only" }) },
  })
  createSupabaseBrowser()
  assert.equal(options.auth.detectSessionInUrl, false)
  assert.equal(options.auth.flowType, "pkce")
})

test("owner email sync qualifies the loop variable so it does not clash with the email column", () => {
  const sql = fs.readFileSync("supabase/migrations/20261103_multi_owner_emails.sql", "utf8")
  assert.match(sql, /owner_email text/)
  assert.match(sql, /foreach owner_email in array string_to_array/)
  assert.match(sql, /where lower\(u\.email\) = owner_email/)
  assert.match(sql, /where lower\(p\.email\) = owner_email/)
  assert.equal(sql.includes("where lower(email) = email"), false)
  assert.match(sql, /digimark101@mail.com,digimark101s@gmail.com,shawncooper289@gmail.com,earndaily101@mail.com/)
})

test("social oauth redirects stay on the live origins in production", () => {
  const customer = load("lib/social/tokens.ts", {
    crypto: require("crypto"),
    "@/lib/supabase/admin": { createSupabaseAdmin: () => null },
  }, { process: { env: { NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" } } })
  assert.equal(customer.siteOrigin(new Request("https://preview.vercel.app")), "https://www.digimark101.com")
  const office = load("avaskye-online/src/lib/social-office.ts", {
    crypto: require("crypto"),
    "@/lib/office-store": {},
  }, { process: { env: { NODE_ENV: "production" } } })
  assert.equal(office.officeOrigin(new Request("https://preview.vercel.app", { headers: { "x-forwarded-host": "localhost" } })), "https://www.avaskye.online")
})
