"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

export function OwnerSignIn({ configured }: { configured: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/office/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "Owner sign-in failed.")
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
    <form className="mt-8 grid max-w-sm gap-3" onSubmit={submit}>
      <label className="text-sm" htmlFor="owner-email">Email</label>
      <input id="owner-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      <label className="text-sm" htmlFor="owner-password">Password</label>
      <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      <button type="submit" className="mt-2 w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !configured}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {configured ? null : <p className="text-sm text-muted">Supabase and the owner mailbox are not set on this server yet.</p>}
      {error ? <p className="text-sm">{error}</p> : null}
    </form>
  )
}
