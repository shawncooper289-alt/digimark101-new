"use client"

import { useEffect, useState } from "react"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export function useStudioUser() {
  const [state, setState] = useState<{ ready: boolean; userId: string | null }>({ ready: false, userId: null })
  useEffect(() => {
    let live = true
    const supabase = createSupabaseBrowser()
    if (!supabase) {
      queueMicrotask(() => live && setState({ ready: true, userId: null }))
      return
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (live) setState({ ready: true, userId: data.user?.id ?? null })
    })
    return () => {
      live = false
    }
  }, [])
  return state
}
