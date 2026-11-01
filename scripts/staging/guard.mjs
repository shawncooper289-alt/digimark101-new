const REF = /^[a-z0-9]{20}$/

export function stagingConfig(env = process.env, { admin = false } = {}) {
  if (env.BETA_STAGE_ACK !== 'isolated-test-data-only') throw new Error('Set the isolated staging acknowledgement.')
  const stagingRef = env.BETA_STAGING_PROJECT_REF || ''
  const productionRef = env.BETA_PRODUCTION_PROJECT_REF || ''
  if (!REF.test(stagingRef) || !REF.test(productionRef) || stagingRef === productionRef) {
    throw new Error('Provide distinct hosted staging and production project references.')
  }
  const expected = `https://${stagingRef}.supabase.co`
  if (env.SUPABASE_URL !== expected) throw new Error('SUPABASE_URL must exactly match the staging project.')
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_DIGIMARK_SUPABASE_URL']) {
    if (env[key] && env[key] !== expected) throw new Error('Conflicting public database URL; refusing to run.')
  }
  if (env.VERCEL_ENV === 'production' || env.VERCEL_TARGET_ENV === 'production') throw new Error('Never run staging fixtures in production.')
  const emails = ['BETA_OWNER_EMAIL', 'BETA_CUSTOMER_A_EMAIL', 'BETA_CUSTOMER_B_EMAIL'].map(key => env[key]?.trim().toLowerCase())
  if (emails.some(email => !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || new Set(emails).size !== 3) {
    throw new Error('Provide three distinct controlled test mailboxes.')
  }
  const ownerEmails = (env.OWNER_EMAIL || '').toLowerCase().split(/[,;\s]+/).filter(Boolean)
  if (ownerEmails.length !== 1 || ownerEmails[0] !== emails[0]) throw new Error('Staging OWNER_EMAIL must contain only the test owner.')
  const key = admin ? env.SUPABASE_SERVICE_ROLE_KEY : env.BETA_STAGING_PUBLIC_KEY
  if (!key) throw new Error('Required staging key is missing.')
  if (!admin && !key.startsWith('sb_publishable_')) {
    let claims
    try { claims = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()) } catch { /* Reject below. */ }
    if (claims?.role !== 'anon' || claims.ref !== stagingRef) throw new Error('Isolation tests require a staging publishable/anon key, never an admin key.')
  }
  return { url: expected, key, emails }
}
