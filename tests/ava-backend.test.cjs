const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks, extras = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => mocks[name], atob, ...extras })
  return exports
}
const config = load('lib/supabase-config.ts', {})
const anon = 'header.' + Buffer.from(JSON.stringify({role:'anon'})).toString('base64') + '.signature'

test('public configuration rejects encrypted envelopes and service role keys', () => {
  assert.equal(config.validPublicConfig('https://test.supabase.co', 'sb_publishable_test'), true)
  assert.equal(config.validPublicConfig('https://test.supabase.co', anon), true)
  assert.equal(config.validPublicConfig('encoded-envelope', anon), false)
  assert.equal(config.validPublicConfig('https://test.supabase.co', 'eyJ2IjoidjIifQ=='), false)
  const service = 'header.' + Buffer.from(JSON.stringify({role:'service_role'})).toString('base64') + '.signature'
  assert.equal(config.validPublicConfig('https://test.supabase.co', service), false)
})

function setup({ authenticated = true, configured = true, apiKey = 'test-only-key', upstream = Response.json({choices:[{message:{content:'Next action'}}]}) } = {}) {
  const calls = []
  const env = { NEXT_PUBLIC_SUPABASE_URL: configured ? 'https://test.supabase.co' : '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test', XAI_API_KEY:apiKey }
  const route = load('app/api/ava/voice-chat/route.ts', {
    'next/server': { NextResponse: { json: (data, options) => Response.json(data, options) } },
    '@supabase/supabase-js': { createClient: () => ({ auth: { getUser: async token => { calls.push(['auth', token]); return {data:{user:authenticated ? {id:'verified-user'} : null},error:null} } } }) },
    '@/lib/supabase-config': config,
  }, { process:{env}, AbortSignal, fetch:async (url, options) => { calls.push(['ai',url,options]); return upstream } })
  return { ...route, calls }
}
const request = (body = JSON.stringify({message:'Help with leads',userId:'forged-user'}), token = 'verified-token') => new Request('https://example.test/api/ava/voice-chat', {method:'POST',headers:token ? {Authorization:'Bearer '+token} : {},body})

test('anonymous and invalid sessions never call xAI', async () => {
  let route = setup()
  assert.equal((await route.POST(request(undefined, null))).status, 401)
  assert.equal(route.calls.length, 0)
  route = setup({authenticated:false})
  assert.equal((await route.POST(request())).status, 401)
  assert.equal(route.calls.filter(c => c[0] === 'ai').length, 0)
})
test('missing config and key fail honestly', async () => {
  assert.equal((await setup({configured:false}).POST(request())).status, 503)
  assert.equal((await setup({apiKey:''}).POST(request())).status, 503)
})
test('invalid JSON and empty or overlong messages are rejected', async () => {
  for (const body of ['{', JSON.stringify({message:''}), JSON.stringify({message:'x'.repeat(4001)})]) {
    const route = setup()
    assert.equal((await route.POST(request(body))).status, 400)
    assert.equal(route.calls.filter(c => c[0] === 'ai').length, 0)
  }
})
test('verified session receives Grok text without exposing key', async () => {
  const route = setup()
  const response = await route.POST(request())
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {text:'Next action',audioUrl:null})
  assert.equal(route.calls[0][1], 'verified-token')
  const call = route.calls[1]
  assert.equal(call[1], 'https://api.x.ai/v1/chat/completions')
  assert.equal(call[2].headers.Authorization, 'Bearer test-only-key')
  assert.equal(JSON.parse(call[2].body).messages[1].content, 'Help with leads')
})
test('upstream failures and invalid content return controlled errors', async () => {
  for (const upstream of [new Response('private upstream error', {status:500}), Response.json({choices:[]}), Response.json({choices:[{message:{content:123}}]})]) {
    const response = await setup({upstream}).POST(request())
    assert.equal(response.status, 502)
    assert.ok(!(await response.text()).includes('private upstream error'))
  }
})
