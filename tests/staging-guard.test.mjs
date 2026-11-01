import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stagingConfig } from '../scripts/staging/guard.mjs'
const good = {
  BETA_STAGE_ACK: 'isolated-test-data-only', BETA_STAGING_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa',
  BETA_PRODUCTION_PROJECT_REF: 'bbbbbbbbbbbbbbbbbbbb', SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
  BETA_OWNER_EMAIL: 'owner@example.com', BETA_CUSTOMER_A_EMAIL: 'a@example.com', BETA_CUSTOMER_B_EMAIL: 'b@example.com',
  OWNER_EMAIL: 'owner@example.com', BETA_STAGING_PUBLIC_KEY: 'sb_publishable_test-only', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
}
test('accepts explicitly isolated staging inputs', () => assert.equal(stagingConfig(good).url, good.SUPABASE_URL))
for (const [name, patch] of [
  ['production ref reused', { BETA_STAGING_PROJECT_REF: good.BETA_PRODUCTION_PROJECT_REF }],
  ['missing production identity', { BETA_PRODUCTION_PROJECT_REF: '' }],
  ['production runtime', { VERCEL_ENV: 'production' }],
  ['production target', { VERCEL_TARGET_ENV: 'production' }],
  ['conflicting public URL', { NEXT_PUBLIC_SUPABASE_URL: 'https://bbbbbbbbbbbbbbbbbbbb.supabase.co' }],
  ['unexpected database URL', { SUPABASE_URL: 'https://elsewhere.example.com' }],
  ['missing acknowledgement', { BETA_STAGE_ACK: '' }],
  ['duplicate mailboxes', { BETA_CUSTOMER_A_EMAIL: good.BETA_OWNER_EMAIL }],
  ['real owner carried over', { OWNER_EMAIL: 'real-owner@example.com' }],
  ['missing public key', { BETA_STAGING_PUBLIC_KEY: '' }],
]) test(`rejects ${name}`, () => assert.throws(() => stagingConfig({ ...good, ...patch })))
test('admin mode requires a protected staging admin key', () => assert.throws(() => stagingConfig({ ...good, SUPABASE_SERVICE_ROLE_KEY: '' }, { admin: true })))

test('customer isolation rejects a service key', () => assert.throws(() => stagingConfig({ ...good, BETA_STAGING_PUBLIC_KEY: 'sb_secret_test-only' })))
test('customer isolation rejects a legacy service-role JWT', () => {
  const claims = Buffer.from(JSON.stringify({ role: 'service_role', ref: good.BETA_STAGING_PROJECT_REF })).toString('base64url')
  assert.throws(() => stagingConfig({ ...good, BETA_STAGING_PUBLIC_KEY: `header.${claims}.signature` }))
})
test('customer isolation accepts a legacy anon key only for staging', () => {
  const claims = Buffer.from(JSON.stringify({ role: 'anon', ref: good.BETA_STAGING_PROJECT_REF })).toString('base64url')
  assert.ok(stagingConfig({ ...good, BETA_STAGING_PUBLIC_KEY: `header.${claims}.signature` }))
})
