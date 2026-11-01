const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(path, mocks, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: id => mocks[id], URLSearchParams, ...globals })
  return exports
}
const { authFailure } = load('avaskye-online/src/lib/auth-failure.ts', {})
test('password, confirmation, backend config and rate failures are distinguishable', () => {
  assert.match(authFailure(400, 'invalid_credentials').error, /password was not accepted/)
  assert.match(authFailure(400, 'email_not_confirmed').error, /Confirm your email/)
  assert.equal(authFailure(401, 'invalid_api_key').status, 503)
  assert.equal(authFailure(429, undefined).status, 429)
  assert.equal(authFailure(500, 'private provider text').error.includes('private provider text'), false)
})
for (const [name, pathname, search, hash, expected] of [
  ['hash session on homepage', '/', '', '#access_token=test&refresh_token=test', '/auth/callback#access_token=test&refresh_token=test'],
  ['token hash on homepage', '/', '?token_hash=test&type=email', '', '/auth/callback?token_hash=test&type=email'],
  ['error on homepage', '/', '?error_description=expired', '', '/auth/callback?error_description=expired'],
  ['ordinary home visit', '/', '', '', undefined],
  ['callback does not loop', '/auth/callback', '', '#access_token=test', undefined],
]) test(name, () => {
  let replaced
  const { AuthLinkLanding } = load('avaskye-online/src/components/auth-link-landing.tsx', { react: { useEffect: fn => fn() } }, { window: { location: { pathname, search, hash, replace: value => { replaced = value } } } })
  AuthLinkLanding()
  assert.equal(replaced, expected)
})

test('password endpoint returns a controlled failure without setting a session cookie', async () => {
  let cookieWrites = 0
  const { POST } = load('avaskye-online/src/app/api/office/session/route.ts', {
    '@/lib/auth-failure': { authFailure },
    'next/headers': { cookies: async () => ({ set: () => { cookieWrites++ } }) },
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/office-redirect': { missingOfficeAuthEnv: () => [] },
    '@/lib/office-store': {
      officeConfig: () => ({ url: 'https://example.supabase.co', anon: 'test-only', emails: ['owner@example.com'] }),
      officeSignInAllowed: () => true,
      supabaseKeyHeaders: () => ({}),
    },
  }, { console: { warn() {} }, fetch: async () => Response.json({ code: 'invalid_credentials' }, { status: 400 }) })
  const result = await POST(new Request('https://office.example.com/api/office/session', { method: 'POST', body: JSON.stringify({ email: 'owner@example.com', password: 'test-only' }) }))
  assert.equal(result.status, 401)
  assert.match((await result.json()).error, /password was not accepted/)
  assert.equal(cookieWrites, 0)
})
