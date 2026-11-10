const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(path, mocks, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: (id) => mocks[id], URL, URLSearchParams, ...globals })
  return exports
}

const { readAuthError } = load('avaskye-online/src/lib/auth-failure.ts', {})

function setup({ providerResponse = () => Response.json({}), mailboxIsOwner = async (email) => email === 'owner@example.com' } = {}) {
  const calls = []
  const jar = { deleted: false }
  const mocks = {
    '@/lib/auth-failure': { readAuthError },
    '@/lib/auth-fetch': {
      authFetch: async (url, options) => {
        calls.push({ url: String(url), options })
        return providerResponse()
      },
    },
    'next/headers': { cookies: async () => ({ set() {}, delete() { jar.deleted = true } }) },
    'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
    '@/lib/office-redirect': {
      missingOfficeAuthEnv: () => [],
      officeCallbackUrl: () => 'https://www.avaskye.online/auth/callback',
      officeResetUrl: () => 'https://www.avaskye.online/reset-password',
    },
    '@/lib/office-store': {
      officeConfig: () => ({ url: 'https://example.supabase.co', anon: 'test-public-key', emails: ['owner@example.com'] }),
      officeSignInAllowed: () => true,
      mailboxIsOwner,
      supabaseKeyHeaders: (key, extra) => ({ apikey: key, ...extra }),
    },
    '@/lib/pkce': {
      createPkcePair: () => ({ verifier: 'verifier', challenge: 'challenge' }),
      pkceCookieOptions: () => ({}),
    },
  }
  return { calls, jar, ...load('avaskye-online/src/app/api/office/magic/route.ts', mocks) }
}

test('office magic link sends redirect_to in the REST query, not SDK options', async () => {
  const route = setup()
  const response = await route.POST(new Request('https://www.avaskye.online/api/office/magic', {
    method: 'POST', body: JSON.stringify({ email: 'owner@example.com' }),
  }))
  assert.equal(response.status, 200)
  const request = route.calls[0]
  assert.equal(new URL(request.url).searchParams.get('redirect_to'), 'https://www.avaskye.online/auth/callback')
  const body = JSON.parse(request.options.body)
  assert.equal(body.email, 'owner@example.com')
  assert.equal(body.create_user, true)
  assert.equal(body.code_challenge, 'challenge')
  assert.equal(body.options, undefined)
})

test('non-owner cannot request a magic link', async () => {
  const route = setup()
  const response = await route.POST(new Request('https://www.avaskye.online/api/office/magic', {
    method: 'POST', body: JSON.stringify({ email: 'outsider@example.com' }),
  }))
  assert.equal(response.status, 400)
  assert.equal(route.calls.length, 0)
})

test('email rate limit is a clear message and does not repeat the provider text', async () => {
  const route = setup({
    providerResponse: () => Response.json({ error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }, { status: 429 }),
  })
  const response = await route.POST(new Request('https://www.avaskye.online/api/office/magic', {
    method: 'POST', body: JSON.stringify({ email: 'owner@example.com' }),
  }))
  assert.equal(response.status, 429)
  const body = await response.json()
  assert.match(body.error, /Too many emails were sent/)
  assert.equal(JSON.stringify(body).includes('email rate limit exceeded'), false)
  assert.equal(route.jar.deleted, true)
})

test('owner lookup failures stay a controlled outage', async () => {
  const route = setup({ mailboxIsOwner: async () => { throw new Error('private-provider-details') } })
  const response = await route.POST(new Request('https://www.avaskye.online/api/office/magic', {
    method: 'POST', body: JSON.stringify({ email: 'owner@example.com' }),
  }))
  assert.equal(response.status, 503)
  assert.equal(JSON.stringify(await response.json()).includes('private-provider-details'), false)
})

test('office password reset emails use the office reset page', async () => {
  const calls = []
  const { POST } = load('avaskye-online/src/app/api/office/recover/route.ts', {
    '@/lib/auth-failure': { readAuthError },
    '@/lib/auth-fetch': { authFetch: async (url, options) => { calls.push({ url: String(url), options }); return Response.json({}) } },
    'next/headers': { cookies: async () => ({ set() {}, delete() {} }) },
    'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
    '@/lib/office-redirect': {
      missingOfficeAuthEnv: () => [],
      officeResetUrl: () => 'https://www.avaskye.online/reset-password',
    },
    '@/lib/office-store': {
      officeConfig: () => ({ url: 'https://example.supabase.co', anon: 'test-public-key', emails: ['owner@example.com'] }),
      officeSignInAllowed: () => true,
      mailboxIsOwner: async () => true,
      supabaseKeyHeaders: () => ({}),
    },
    '@/lib/pkce': {
      createPkcePair: () => ({ verifier: 'verifier', challenge: 'challenge' }),
      pkceCookieOptions: () => ({}),
    },
  })
  const response = await POST(new Request('https://www.avaskye.online/api/office/recover', {
    method: 'POST', body: JSON.stringify({ email: 'owner@example.com' }),
  }))
  assert.equal(response.status, 200)
  assert.equal(new URL(calls[0].url).pathname, '/auth/v1/recover')
  assert.equal(new URL(calls[0].url).searchParams.get('redirect_to'), 'https://www.avaskye.online/reset-password')
})
