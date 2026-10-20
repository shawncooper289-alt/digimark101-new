const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('../avaskye-online/node_modules/typescript')
function setup(owner = null) {
  const calls = []
  const exports = {}
  const mocks = {
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/office-store': { readOfficeOwner: async () => owner },
    '@/lib/desk': { deskSnapshot: async () => ({ contacts: 2 }) },
    '@shared/ava/respond': { respondToAva: async (...args) => { calls.push(args); return { text: 'Shared Ava reply', mode: 'xai', live: true } } },
  }
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('avaskye-online/src/app/api/office/guide/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => mocks[name], Map, Date, URL })
  return { ...exports, calls }
}
const request = (message, origin) => new Request('https://office.example/api/office/guide', { method: 'POST', headers: origin ? { origin } : {}, body: JSON.stringify({ message }) })
test('private Ava engine cannot be called anonymously or cross-origin', async () => {
  let app = setup()
  assert.equal((await app.POST(request('Help with SEO'))).status, 403)
  assert.equal(app.calls.length, 0)
  app = setup({ id: 'owner' })
  assert.equal((await app.POST(request('Help with SEO', 'https://other.example'))).status, 403)
  assert.equal(app.calls.length, 0)
})
test('open-ended office questions use the same Ava response engine', async () => {
  const app = setup({ id: 'owner' })
  const data = await (await app.POST(request('Help with SEO'))).json()
  assert.equal(data.reply, 'Shared Ava reply')
  assert.equal(data.live, true)
  assert.equal(app.calls.length, 1)
  assert.match(app.calls[0][1].extra, /not executed any tool/)
})
test('calendar navigation does not invoke a model or perform a write', async () => {
  const app = setup({ id: 'owner' })
  assert.equal((await (await app.POST(request('open calendar'))).json()).href, '/calendar')
  assert.equal(app.calls.length, 0)
})
