const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const code = ts.transpileModule(fs.readFileSync('lib/ava/account-setup.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const mod = {}
vm.runInNewContext(code, { exports: mod, require: () => ({ site: { url: 'https://www.digimark101.com', email: 'hi@digimark101.com' } }) })
const { setupReply, ACCOUNT_SETUP_QUESTIONS: Q } = mod

function run(answers) {
  const turns = [{ role: 'user', content: 'set up my account' }]
  let reply = setupReply(turns)
  for (const answer of answers) {
    turns.push({ role: 'assistant', content: reply }, { role: 'user', content: answer })
    reply = setupReply(turns)
  }
  return { turns, reply }
}

test('a correction updates the earlier answer and repeats the open question', () => {
  const { reply } = run(['Sam', 'Flow Hous', 'actually the studio is called Flow Haus'])
  assert.match(reply, /Flow Haus/)
  assert.ok(reply.includes(Q[2].ask))
})

test('a question is answered without being saved as the answer', () => {
  const { reply } = run(['Sam', 'why do you ask?'])
  assert.ok(reply.includes(Q[1].ask))
})

test('an explicit task exits the setup flow', () => {
  assert.equal(run(['Sam', 'create a campaign for my yoga class']).reply, null)
})

test('the last answer ends with a recap and the full signup link', () => {
  const { reply } = run(['Sam', 'Flow Haus', 'yoga', 'moms', 'Austin', 'none', 'Instagram', 'guide me', 'first sale', 'sam@example.com', 'nothing yet'])
  assert.match(reply, /Business: Flow Haus/)
  assert.ok(reply.includes('https://www.digimark101.com/signup?email=sam%40example.com'))
})
