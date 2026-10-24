"use client"

import { useState, type FormEvent } from "react"

export function RequestAccess({ planKey, planName }: { planKey: string; planName: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setNote(null)
    setError(null)
    try {
      const response = await fetch("/api/membership/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
          plan: planKey,
          consent_contact: consent,
          company_website_confirm: "",
        }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "The request was not saved.")
        return
      }
      setNote("Request received. We will send a studio login when the seat is open.")
      setMessage("")
    } catch {
      setError("The request was not saved.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-5 grid gap-3" onSubmit={submit}>
      <p className="text-sm font-semibold">Request access to {planName}</p>
      <p className="text-sm text-ink-soft">PayPal checkout is not ready on this server. Leave your details and the seat can still be opened from the owner office.</p>
      <input className="hidden" tabIndex={-1} autoComplete="off" name="company_website_confirm" aria-hidden="true" />
      <label className="grid gap-1 text-sm">
        Name
        <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Company
        <input value={company} onChange={(event) => setCompany(event.target.value)} className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Note
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-24 rounded-2xl border border-ink/15 bg-mist px-3 py-2" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1" />
        You may email me about this membership. This is not a charge.
      </label>
      <button type="submit" className="btn btn-signal w-fit" disabled={pending || !consent}>
        {pending ? "Sending…" : "Request access"}
      </button>
      {note ? <p className="text-sm" role="status">{note}</p> : null}
      {error ? <p className="text-sm text-signal" role="status">{error}</p> : null}
    </form>
  )
}
