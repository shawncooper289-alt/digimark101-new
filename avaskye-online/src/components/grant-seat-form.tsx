"use client"

import { useState, type FormEvent } from "react"

const plans = [
  { key: "starter", label: "Starter" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "semiannual", label: "Semiannual" },
]

export function GrantSeatForm() {
  const [email, setEmail] = useState("")
  const [planKey, setPlanKey] = useState("monthly")
  const [confirmed, setConfirmed] = useState(false)
  const [pending, setPending] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setNote(null)
    setError(null)
    try {
      const response = await fetch("/api/office/grant-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planKey, confirmed }),
      })
      const data = (await response.json()) as { error?: string; message?: string }
      if (!response.ok) {
        setError(data.error || "The seat was not granted.")
        return
      }
      setNote(data.message || "Seat granted.")
      setEmail("")
      setConfirmed(false)
    } catch {
      setError("The seat was not granted.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 max-w-md rounded-3xl border border-border bg-surface p-4" onSubmit={submit}>
      <h2 className="text-2xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Grant seat manually</h2>
      <p className="mt-2 text-sm text-muted">Opens a studio workspace for a paying customer and emails a login link. Use this when PayPal plans are not live yet.</p>
      <label className="mt-4 grid gap-1 text-sm" htmlFor="grant-email">
        Customer email
        <input id="grant-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2" />
      </label>
      <label className="mt-3 grid gap-1 text-sm" htmlFor="grant-plan">
        Plan
        <select id="grant-plan" value={planKey} onChange={(event) => setPlanKey(event.target.value)} className="rounded-full border border-border bg-transparent px-4 py-2">
          {plans.map((plan) => (
            <option key={plan.key} value={plan.key}>{plan.label}</option>
          ))}
        </select>
      </label>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
        Confirm this grant. It sends a studio login to that mailbox.
      </label>
      <button type="submit" className="mt-4 rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !confirmed}>
        {pending ? "Granting…" : "Grant seat manually"}
      </button>
      {note ? <p className="mt-3 text-sm text-muted" role="status">{note}</p> : null}
      {error ? <p className="mt-3 text-sm" role="status">{error}</p> : null}
    </form>
  )
}
