"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("Signing you in…")

  useEffect(() => {
    async function finish() {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
      const params = new URLSearchParams(hash)
      const error = query.get("error_description") || query.get("error") || params.get("error_description") || params.get("error")
      if (error) {
        setStatus("The login link was rejected. Request a new one, or sign in with a password.")
        return
      }
      window.history.replaceState({}, "", "/auth/callback")
      const tokenHash = query.get("token_hash")
      const type = query.get("type") || "magiclink"
      if (tokenHash) {
        try {
          const verified = await fetch("/api/office/session/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_hash: tokenHash, type }),
          })
          if (!verified.ok) {
            setStatus("Could not finish sign-in. Request a new login link, or use the password form.")
            return
          }
          router.replace("/")
          router.refresh()
        } catch {
          setStatus("Could not finish sign-in.")
        }
        return
      }
      const access_token = params.get("access_token") || query.get("access_token")
      const refresh_token = params.get("refresh_token") || query.get("refresh_token")
      const expires_in = params.get("expires_in") || query.get("expires_in")
      if (!access_token || !refresh_token) {
        setStatus("This login link did not include a session. Request a new one, or sign in with a password.")
        return
      }
      try {
        const response = await fetch("/api/office/session/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token, expires_in: Number(expires_in) || 3600 }),
        })
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null
          setStatus(data?.error || "Could not finish sign-in. Try the password form instead.")
          return
        }
        router.replace("/")
        router.refresh()
      } catch {
        setStatus("Could not finish sign-in.")
      }
    }
    void finish()
  }, [router])

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <p className="text-sm text-muted">{status}</p>
    </main>
  )
}
