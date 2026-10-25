"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { establishSessionFromUrl, safeNextPath } from "@/lib/auth/establish-session"

type Phase = "working" | "error" | "unconfigured"

export default function StudioAuthCallback() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("working")

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
    const hashType = new URLSearchParams(hash).get("type")
    const type = (query.get("type") || hashType || "").toLowerCase()
    const nextPath = safeNextPath(query.get("next"), type === "recovery" ? "/reset-password" : "/studio")

    async function finish() {
      const result = await establishSessionFromUrl()
      if (!result.ok) {
        setPhase(result.reason === "unconfigured" ? "unconfigured" : "error")
        return
      }
      const destination = result.type === "recovery" && nextPath === "/studio" ? "/reset-password" : nextPath
      router.replace(destination)
      router.refresh()
    }
    void finish()
  }, [router])

  if (phase === "working") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <p className="text-sm text-ink-soft">Opening your studio…</p>
      </main>
    )
  }

  const unconfigured = phase === "unconfigured"
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <h1 className="font-serif text-4xl">{unconfigured ? "Sign-in is not available yet" : "This link didn't work"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {unconfigured
          ? "This site is not ready to confirm accounts yet. You can go back to sign in and try again later."
          : "This confirmation link is invalid or has expired. Request a new one, or sign in if you already confirmed your email."}
      </p>
      <Link href="/login" className="btn btn-signal mt-6 w-fit">
        Back to sign in
      </Link>
    </main>
  )
}
