const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('../avaskye-online/node_modules/typescript')

function load(file, mocks, extras = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => mocks[name], ...extras })
  return exports
}
function setup(owner = null, response = Response.json([])) {
  const calls = []
  const store = {
    readOfficeOwner: async () => owner,
    officeConfig: () => ({ url: 'https://database.example', anon: 'public-test', service: 'server-test', configured: true }),
    supabaseKeyHeaders: (key, extra = {}) => ({ apikey: key, ...extra }),
    missingOfficeEnv: () => [],
  }
  const fetch = async (...args) => { calls.push(args); return response }
  const mocks = { 'next/headers': { cookies: async () => ({ get: () => undefined }) }, '@/lib/office-store': store }
  const desk = load('avaskye-online/src/lib/desk.ts', mocks, { fetch })
  const content = load('avaskye-online/src/lib/content-command.ts', {})
  const route = load('avaskye-online/src/app/api/office/mutate/route.ts', {
    ...mocks,
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
    '@/lib/products': { isHubProduct: () => true },
    '@/lib/content-command': content,
    '@/lib/workspace-command': load('avaskye-online/src/lib/workspace-command.ts', {}),
  }, { fetch })
  return { desk, route, calls }
}
const id = '12345678-1234-1234-1234-123456789abc'
const request = (body) => new Request('https://office.example/api/office/mutate', { method: 'POST', body: JSON.stringify(body) })

test('anonymous and customer sessions cannot read platform tables or admin users', async () => {
  // readOfficeOwner returns null both for anonymous visitors and verified non-owner accounts.
  const { desk, calls } = setup()
  assert.equal(await desk.deskCount('contacts'), null)
  assert.equal(await desk.deskRowsMaybe('sites', 'select=id'), null)
  assert.equal((await desk.deskClients()).length, 0)
  assert.equal(calls.length, 0)
})

test('verified owners receive counts, and table errors are not reported as zero', async () => {
  let app = setup({ id }, new Response('[]', { headers: { 'content-range': '0-0/12' } }))
  assert.equal(await app.desk.deskCount('contacts'), 12)
  app = setup({ id }, new Response('unavailable', { status: 403 }))
  assert.equal(await app.desk.deskCount('contacts'), null)
  assert.equal(await app.desk.deskRowsMaybe('sites', 'select=id'), null)
})

test('content mutation requires verified owner and explicit confirmation', async () => {
  let app = setup()
  assert.equal((await app.route.POST(request({ action: 'update_site_content', confirmed: true, id, name: 'Page' }))).status, 403)
  assert.equal(app.calls.length, 0)
  app = setup({ id })
  assert.equal((await app.route.POST(request({ action: 'update_site_content', id, name: 'Page' }))).status, 400)
  assert.equal(app.calls.length, 0)
})

test('confirmed edits only patch allowed fields and check the affected record', async () => {
  const app = setup({ id }, Response.json([{ id }]))
  const response = await app.route.POST(request({ action: 'update_site_content', confirmed: true, id, name: 'Page', headline: 'Hello', status: 'published', owner_id: 'forged' }))
  assert.equal(response.status, 200)
  assert.deepEqual(JSON.parse(app.calls[0][1].body), { name: 'Page', headline: 'Hello' })
  assert.equal(app.calls[0][1].headers.Prefer, 'return=representation')
  const missing = setup({ id }, Response.json([]))
  assert.equal((await missing.route.POST(request({ action: 'update_site_content', confirmed: true, id, name: 'Page' }))).status, 404)
})
