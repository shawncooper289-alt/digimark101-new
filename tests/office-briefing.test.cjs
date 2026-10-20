const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('../avaskye-online/node_modules/typescript')
function setup({ owner = { id: 'owner' }, service = 'test', live = true, existing = [], writeOk = true } = {}) {
 const calls = []; let models = 0; const exports = {}
 const mocks = {
  'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
  '@/lib/office-store': { readOfficeOwner: async () => owner, officeConfig: () => ({ url: 'https://db.example', service }), supabaseKeyHeaders: (key, extra) => ({ apikey: key, ...extra }) },
  '@shared/ava/respond': { respondToAva: async () => { models++; return { text: 'Plan', live } } },
 }
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('avaskye-online/src/app/api/office/briefing/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => mocks[name], URL, Date, fetch: async (url, init) => { calls.push([url, init]); return init.method === 'POST' ? new Response(null, { status: writeOk ? 201 : 503 }) : Response.json(existing) } })
 return { ...exports, calls, models: () => models }
}
const request = () => new Request('https://office.example/api/office/briefing', { method: 'POST' })
test('briefing requires owner and durable storage credentials', async () => {
 let app = setup({ owner: null }); assert.equal((await app.POST(request())).status, 403); assert.equal(app.calls.length, 0)
 app = setup({ service: '' }); assert.equal((await app.POST(request())).status, 503); assert.equal(app.models(), 0)
})
test('existing daily briefing avoids a second model request', async () => {
 const app = setup({ existing: [{ memory_value: 'Saved' }] }); assert.equal((await app.POST(request())).status, 200); assert.equal(app.models(), 0); assert.equal(app.calls.length, 1)
})
test('guide fallback is not stored as an AI planning briefing', async () => {
 const app = setup({ live: false }); assert.equal((await app.POST(request())).status, 503); assert.equal(app.calls.length, 1)
})
test('live brief is preserved once without overwriting an existing day', async () => {
 const app = setup(); assert.equal((await app.POST(request())).status, 200)
 assert.equal(app.calls[1][1].headers.Prefer, 'resolution=ignore-duplicates,return=minimal')
 assert.match(JSON.parse(app.calls[1][1].body).memory_value, /not live market research/)
 const failed = setup({ writeOk: false }); assert.equal((await failed.POST(request())).status, 503)
})
