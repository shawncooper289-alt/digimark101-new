"use client"

import { createBrowserClient } from "@supabase/ssr"
import { supabasePublicConfig } from "@/lib/supabase/config"

export function createSupabaseBrowser(options?: { detectSessionInUrl?: boolean }) {
  const config = supabasePublicConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.key, {
    auth: {
      // Callback and reset pages explicitly exchange the one-time URL credentials.
      detectSessionInUrl: options?.detectSessionInUrl ?? false,
      flowType: "pkce",
    },
  })
}
