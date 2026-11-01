import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { stagingConfig } from './guard.mjs'

const { url, key, emails } = stagingConfig()
if (process.env.BETA_ALLOW_TEST_WRITES !== 'yes') throw new Error('Explicit staging test-write acknowledgement required.')
const clients = [0, 1].map(() => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }))
const passwords = [process.env.BETA_CUSTOMER_A_PASSWORD, process.env.BETA_CUSTOMER_B_PASSWORD]
const users = []
let recordId
try {
  for (let i = 0; i < clients.length; i++) {
    if (!passwords[i]) throw new Error('Set test passwords via protected environment inputs.')
    const { data, error } = await clients[i].auth.signInWithPassword({ email: emails[i + 1], password: passwords[i] })
    if (error || !data.user) throw new Error(`Test customer ${i + 1} could not sign in. Confirm its email and recovery password first.`)
    users.push(data.user)
  }
  const marker = `beta-isolation-${randomUUID()}`
  const created = await clients[0].from('contacts').insert({ owner_id: users[0].id, name: marker }).select('id,name').single()
  assert.equal(created.error, null, 'Customer A must be able to create its own contact')
  recordId = created.data.id
  const own = await clients[0].from('contacts').select('id,name').eq('id', recordId).single()
  assert.equal(own.error, null)
  assert.equal(own.data.name, marker, 'Own data must persist')
  const hidden = await clients[1].from('contacts').select('id').eq('id', recordId)
  assert.equal(hidden.error, null)
  assert.equal(hidden.data.length, 0, 'Customer B must not read customer A data')
  const changed = await clients[1].from('contacts').update({ name: 'unauthorized-test-write' }).eq('id', recordId).select('id')
  assert.ok(changed.error || changed.data.length === 0, 'Customer B must not update customer A data')
  const unchanged = await clients[0].from('contacts').select('name').eq('id', recordId).single()
  assert.equal(unchanged.error, null)
  assert.equal(unchanged.data.name, marker)
  console.log('PASS: two customer sign-ins, own contact persistence, cross-account read/update denial. This is contacts-only coverage, not all backend acceptance.')
} finally {
  if (recordId) {
    const cleanup = await clients[0].from('contacts').delete().eq('id', recordId).select('id')
    if (cleanup.error || cleanup.data?.length !== 1) throw new Error('Test contact cleanup not confirmed. Inspect staging test records before rerunning.')
  }
  await Promise.all(clients.map(client => client.auth.signOut()))
}
