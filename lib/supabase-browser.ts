import { createClient } from '@supabase/supabase-js'
import { supabasePublicConfig } from '@/lib/supabase/config'

const config = supabasePublicConfig()
// Never accept a service-role key or an encrypted configuration envelope in the browser.
export const supabase = config ? createClient(config.url, config.key) : null
