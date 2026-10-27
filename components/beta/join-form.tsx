"use client"

import Link from "next/link"
import { useState } from "react"

export function BetaJoinForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [email, setEmail] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [consent, setConsent] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (!consent) {
      setError("Check the box to join the beta.")
      return
    }
    setBusy(true)
    try {
      const response = await fetch("/api/beta/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, inviteCode }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) setError(body.error || "Could not send the sign-in email.")
      else setMessage(`Check ${email.trim()} for a sign-in link, including spam. That link opens a free beta seat. It does not start a payment.`)
    } catch {
      setError("Could not send the sign-in email.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-3">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-11 rounded-2xl border border-ink/15 bg-paper px-3"
        />
      </label>
      {inviteRequired ? (
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Invite code</span>
          <input
            required
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            className="min-h-11 rounded-2xl border border-ink/15 bg-paper px-3"
          />
        </label>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
        <span>
          I agree to try DigiMark101 while it is in beta and to the{" "}
          <Link href="/privacy" className="underline">privacy note</Link>.
          Ava will not publish, spend, or email my customers until I say yes. This seat is free and does not use PayPal.
        </span>
      </label>
      <button type="submit" className="btn btn-signal" disabled={busy}>{busy ? "Sending…" : "Email me a beta link"}</button>
      {error ? <p className="text-sm text-signal" role="alert">{error}</p> : null}
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  )
}
