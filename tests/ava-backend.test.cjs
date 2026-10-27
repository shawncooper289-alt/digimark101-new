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

test('voice chat delegates the body to the studio handler', async () => {
  const seen = []
  const route = load('app/api/ava/voice-chat/route.ts', {
    '@/lib/ava/handle': {
      handleAvaPost: async (request) => {
        seen.push(await request.text())
        return Response.json({ text: 'Next action', audioUrl: null })
      },
    },
  })
  const response = await route.POST(new Request('https://example.test/api/ava/voice-chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Help with leads' }),
  }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { text: 'Next action', audioUrl: null })
  assert.equal(JSON.parse(seen[0]).message, 'Help with leads')
})
