const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, extras = {}) {
 const exports = {}
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 vm.runInNewContext(code, { exports, URL, process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://holding.vercel.app', OFFICE_PUBLIC_URL: 'https://holding.vercel.app' } }, ...extras })
 return exports
}
test('customer confirmation and recovery always use the public domain', () => {
 const urls = load('lib/auth/site-url.ts')
 assert.equal(urls.authCallbackUrl(), 'https://www.digimark101.com/auth/callback')
 assert.equal(urls.resetPasswordUrl(), 'https://www.digimark101.com/reset-password')
})
test('office emails never redirect to previews or spoofed forwarded hosts', () => {
 const urls = load('avaskye-online/src/lib/office-redirect.ts')
 for (const host of ['holding.vercel.app', 'attacker.example', 'www.avaskye.online', 'localhost']) {
  assert.equal(urls.officeCallbackUrl(new Request('https://' + host, { headers: { 'x-forwarded-host': 'attacker.example' } })), 'https://www.avaskye.online/auth/callback')
 }
})
test('auth network failures return a controlled temporary outage', async () => {
 const auth = load('avaskye-online/src/lib/auth-fetch.ts', { AbortSignal, Response, fetch: async () => { throw new Error('network') } })
 assert.equal((await auth.authFetch('https://provider.example')).status, 503)
})
test('auth requests have a deadline and never cache credentials', async () => {
 let options
 const auth = load('avaskye-online/src/lib/auth-fetch.ts', { AbortSignal, Response, fetch: async (url, init) => { options = init; return Response.json({}) } })
 await auth.authFetch('https://provider.example', { method: 'POST' })
 assert.equal(options.cache, 'no-store')
 assert.ok(options.signal)
})
