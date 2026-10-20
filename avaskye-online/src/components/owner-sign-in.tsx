"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

export function OwnerSignIn({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent, intent: "signin" | "signup" | "recover" = "signin") {
    event.preventDefault()
    setPending(true)
    setError(null)
    setNote(null)
    try {
      const response = await fetch("/api/office/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, intent }),
      })
      const data = (await response.json()) as { error?: string; message?: string }
      if (!response.ok) {
        setError(data.error || "Owner sign-in failed.")
        return
      }
      if (data.message) {
        setNote(data.message)
        setPassword("")
        return
      }
      setPassword("")
      router.refresh()
    } catch {
      setError("Owner sign-in failed.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 grid max-w-sm gap-3" onSubmit={(event) => void submit(event, "signin")}>
      <p className="text-sm text-muted">Use your founder mailbox. The first time, choose a password and set it. Customer emails cannot open this office, and an existing password is never replaced from here.</p>
      <label className="text-sm" htmlFor="owner-email">Email</label>
      <input id="owner-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      <label className="text-sm" htmlFor="owner-password">Password</label>
      <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !configured}>
          {pending ? "Working…" : "Sign in"}
        </button>
        <button
          type="button"
          className="w-fit rounded-full border border-border px-4 py-2 text-sm"
          disabled={pending || !configured}
          onClick={(event) => {
            const form = event.currentTarget.form
            if (password.length < 8) {
              setError("Use a password of at least 8 characters.")
              return
            }
            if (form?.reportValidity()) void submit(event, "signup")
          }}
        >
          Set founder password
        </button>
      </div>
      <button type="button" className="w-fit text-sm text-muted underline" disabled={pending || !configured} onClick={(event) => void submit(event, "recover")}>
        Email a reset link
      </button>
      {configured ? null : <p className="text-sm text-muted">Supabase and the owner mailbox are not set on this server yet.</p>}
      {note ? <p className="text-sm">{note}</p> : null}
      {error ? <p className="text-sm">{error}</p> : null}
    </form>
  )
}
