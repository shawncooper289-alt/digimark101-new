import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export function getSupabase() {
 if (!env.supabaseUrl || !env.supabaseKey) throw new Error('Supabase is not configured. Add the project URL and publishable key.');
 return createClient(env.supabaseUrl, env.supabaseKey);
}
