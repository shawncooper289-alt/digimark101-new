import { createClient } from '@supabase/supabase-js'
import { validPublicConfig } from '@/lib/supabase-config'
const url = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Never accept a service-role key or an encrypted configuration envelope in the browser.
export const supabase = validPublicConfig(url, key) ? createClient(url!, key!) : null
