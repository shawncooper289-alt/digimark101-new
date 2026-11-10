"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

export function OwnerSignIn({ configured, missing = [], next }: { configured: boolean; missing?: string[]; next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/office/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(28000),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "Owner sign-in failed.")
        return
      }
      setPassword("")
      if (next) router.replace(next)
      router.refresh()
    } catch {
      setError("Owner sign-in failed.")
    } finally {
      setPending(false)
    }
  }

  async function sendMagicLink() {
    if (pending) return
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/office/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(20000),
      })
      const data = (await response.json()) as { error?: string; message?: string }
      if (!response.ok) {
        setError(data.error || "Could not send login link.")
        return
      }
      setMessage(data.message || "Login link sent. Check your inbox.")
    } catch {
      setError("Could not send login link.")
    } finally {
      setPending(false)
    }
  }

  async function sendReset() {
    if (pending) return
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/office/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(20000),
      })
      const data = (await response.json()) as { error?: string; message?: string }
      if (!response.ok) {
        setError(data.error || "Could not send the reset link.")
        return
      }
      setMessage(data.message || "Reset link sent. Open it in this browser.")
    } catch {
      setError("Could not send the reset link.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 grid max-w-sm gap-3" onSubmit={submit}>
      <label className="text-sm" htmlFor="owner-email">Email</label>
      <input id="owner-email" type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" required />
      <label className="text-sm" htmlFor="owner-password">Password</label>
      <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      <button type="submit" className="mt-2 w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !configured}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <button type="button" onClick={() => void sendMagicLink()} className="w-fit rounded-full border border-border px-4 py-2 text-sm" disabled={pending || !configured || !email}>
        {pending ? "Sending…" : "Email me a login link"}
      </button>
      <button type="button" onClick={() => void sendReset()} className="w-fit rounded-full border border-border px-4 py-2 text-sm" disabled={pending || !configured || !email}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      {configured ? null : (
        <p className="text-sm text-muted" role="status">
          Sign-in is off until this server has {missing.length ? missing.join(", ") : "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and OWNER_EMAIL"}.
        </p>
      )}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      {error ? <p className="text-sm" role="alert">{error}</p> : null}
    </form>
  )
}
