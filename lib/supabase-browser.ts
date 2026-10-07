import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY
// Refuse malformed integration values rather than attempting requests with them.
export const supabase = url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) && key && (key.startsWith('sb_publishable_') || key.startsWith('eyJhbGci')) ? createClient(url, key) : null
