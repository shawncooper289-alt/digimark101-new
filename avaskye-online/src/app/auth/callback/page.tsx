"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { consumeOfficeLink } from "@/lib/finish-office-link"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("Signing you in\u2026")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void consumeOfficeLink()
      .then((result) => {
        if (result.result === "signed-in") {
          router.replace(result.type === "recovery" ? "/reset-password" : "/")
          router.refresh()
          return
        }
        if (result.result === "rejected") {
          setStatus("The login link was rejected. Request a new one, or sign in with a password.")
          return
        }
        if (result.result === "missing") {
          setStatus("This login link did not include a session. Request a new one, or sign in with a password.")
          return
        }
        setStatus("Could not finish sign-in. Request a new login link, or use the password form.")
      })
      .catch(() => setStatus("Could not finish sign-in. Request a new login link, or use the password form."))
  }, [router])

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div>
        <p role="status" className="text-sm text-muted">
          {status}
        </p>
        <a href="/login" className="mt-4 block underline">
          Back to owner sign-in
        </a>
      </div>
    </main>
  )
}
