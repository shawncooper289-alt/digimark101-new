"use client"

import { useEffect } from "react"

/** Supabase can fall back to Site URL when an email redirect is not allowlisted. */
export function AuthLinkLanding() {
  useEffect(() => {
    if (window.location.pathname === "/auth/callback") return
    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const hasSessionLink = query.has("token_hash") || hash.has("access_token") || query.has("access_token")
    const hasLinkError = query.has("error_description") || hash.has("error_description")
    if (!hasSessionLink && !hasLinkError) return
    // Full navigation removes the old URL from history and lets the callback consume it once.
    window.location.replace(`/auth/callback${window.location.search}${window.location.hash}`)
  }, [])
  return null
}
