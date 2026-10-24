"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export default function StudioAuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("Opening your studio…")

  useEffect(() => {
    async function finish() {
      const query = new URLSearchParams(window.location.search)
      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
      const params = new URLSearchParams(hash)
      const error = query.get("error_description") || query.get("error") || params.get("error_description")
      if (error) {
        setStatus("This login link was rejected. Use the password form, or ask for a new invite.")
        return
      }
      const access_token = params.get("access_token") || query.get("access_token")
      const refresh_token = params.get("refresh_token") || query.get("refresh_token")
      window.history.replaceState({}, "", "/auth/callback")
      const supabase = createSupabaseBrowser()
      if (!supabase) {
        setStatus("Supabase is not configured on this site yet.")
        return
      }
      if (!access_token || !refresh_token) {
        setStatus("This login link did not include a session. Request a new invite from the office.")
        return
      }
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
      if (sessionError) {
        setStatus("Could not open the studio session. Sign in with your password if you have one.")
        return
      }
      router.replace("/studio")
      router.refresh()
    }
    void finish()
  }, [router])

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <p className="text-sm text-ink-soft">{status}</p>
    </main>
  )
}
