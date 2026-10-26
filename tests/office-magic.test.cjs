const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function setup() {
  const calls = []
  const mocks = {
    'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
    '@/lib/office-redirect': { missingOfficeAuthEnv: () => [], officeCallbackUrl: () => 'https://www.avaskye.online/auth/callback' },
    '@/lib/office-store': {
      officeConfig: () => ({ url: 'https://example.supabase.co', anon: 'test-public-key', emails: ['owner@example.com'] }),
      officeSignInAllowed: () => true,
      supabaseKeyHeaders: (key, extra) => ({ apikey: key, ...extra }),
    },
  }
  const code = ts.transpileModule(fs.readFileSync('avaskye-online/src/app/api/office/magic/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => mocks[name], URL, fetch: async (url, options) => {
    calls.push({ url: String(url), options })
    return Response.json({})
  } })
  return { ...exports, calls }
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
