import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { stagingConfig } from './guard.mjs'

// Run on a trusted machine with protected environment inputs, never in an app route.
const { url, key, emails } = stagingConfig(process.env, { admin: true })
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const mode = process.argv[2] || 'check'
if (!['check', 'create'].includes(mode)) throw new Error('Use check or create. No destructive cleanup is provided.')
if (mode === 'check') {
  console.log('Staging configuration passed. No account changes made.')
} else {
  if (process.env.BETA_ALLOW_ACCOUNT_CREATE !== 'yes') throw new Error('Explicit account-creation acknowledgement required.')
  for (let index = 0; index < emails.length; index++) {
    const password = randomBytes(32).toString('base64url')
    const { data, error } = await admin.auth.admin.createUser({
      email: emails[index], password, email_confirm: false,
      app_metadata: { beta_test_fixture: true, ...(index === 0 ? { role: 'owner' } : {}) },
    })
    if (error || !data.user) throw new Error(`Test identity ${index + 1} was not created. Stop and inspect staging Auth; earlier identities may already exist. No existing account was altered.`)
    console.log(`Created test identity ${index + 1}. Set its password through mailbox recovery; generated passwords are not retained or displayed.`)
  }
}
