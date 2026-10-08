import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Legacy JWTs must explicitly be the public anon role, never service_role.
function publicKey(value: string | undefined): value is string {
 if (!value) return false
 if (value.startsWith('sb_publishable_')) return true
 try { return JSON.parse(atob(value.split('.')[1])).role === 'anon' } catch { return false }
}
// Refuse malformed integration values rather than attempting requests with them.
export const supabase = url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && publicKey(key) ? createClient(url, key) : null
