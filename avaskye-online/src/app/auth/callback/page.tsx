"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("Signing you in…")

  useEffect(() => {
    async function finish() {
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
      const params = new URLSearchParams(hash)
      const access_token = params.get("access_token")
      const refresh_token = params.get("refresh_token")
      const expires_in = params.get("expires_in")
      if (!access_token || !refresh_token) {
        setStatus("Login link is missing tokens. Try requesting a new one.")
        return
      }
      try {
        const response = await fetch("/api/office/session/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token, refresh_token, expires_in: Number(expires_in) || 3600 }),
        })
        if (!response.ok) {
          setStatus("Could not finish sign-in. Try the password form instead.")
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
