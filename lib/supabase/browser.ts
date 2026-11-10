"use client"

import { createBrowserClient } from "@supabase/ssr"
import { supabasePublicConfig } from "@/lib/supabase/config"

export function createSupabaseBrowser(options?: { detectSessionInUrl?: boolean }) {
  const config = supabasePublicConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.key, {
    global: {
      fetch: (input, init) => {
        const timeout = AbortSignal.timeout(8000)
        const signal =
          init?.signal && typeof AbortSignal.any === "function"
            ? AbortSignal.any([init.signal, timeout])
            : (init?.signal ?? timeout)
        return fetch(input, { ...init, signal })
      },
    },
    auth: {
      // Callback and reset pages explicitly exchange the one-time URL credentials.
      detectSessionInUrl: options?.detectSessionInUrl ?? false,
      flowType: "pkce",
    },
  })
}
