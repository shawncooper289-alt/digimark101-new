import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { supabasePublicConfig } from "@/lib/supabase/config"

export async function createSupabaseServer() {
  const config = supabasePublicConfig()
  if (!config) return null
  const cookieStore = await cookies()
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Proxy refreshes the session. Server Components cannot always write cookies.
        }
      },
    },
  })
}

export async function currentUser() {
  const supabase = await createSupabaseServer()
  if (!supabase) return { supabase: null, user: null }
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}
