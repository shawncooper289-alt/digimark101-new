"use client"

import { createBrowserClient } from "@supabase/ssr"
import { supabasePublicConfig } from "@/lib/supabase/config"

export function createSupabaseBrowser(options?: { detectSessionInUrl?: boolean }) {
  const config = supabasePublicConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.key, {
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)])
          : AbortSignal.timeout(8000),
      }),
    },
    auth: {
      // Callback and reset pages explicitly exchange the one-time URL credentials.
      detectSessionInUrl: options?.detectSessionInUrl ?? false,
      flowType: "pkce",
    },
  })
}
