"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import type { FirstAnswers, FirstJob } from "@/lib/start/first-campaign"

const empty: FirstAnswers = { business: "", sells: "", buyer: "", place: "", result: "" }

const fields: { key: keyof FirstAnswers; label: string; placeholder: string }[] = [
  { key: "business", label: "Business name", placeholder: "Northline Plumbing" },
  { key: "sells", label: "What do you sell?", placeholder: "Same-week drain repair" },
  { key: "buyer", label: "Who buys it?", placeholder: "Homeowners with a slow drain" },
  { key: "place", label: "Where are they?", placeholder: "Austin, Texas" },
  { key: "result", label: "What should this campaign do this month?", placeholder: "Book five service calls" },
]

export function FirstBrief() {
  const [answers, setAnswers] = useState(empty)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [payment, setPayment] = useState<FirstJob["payment"]>("not-confirmed")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch("/api/start")
      .then((response) => response.json())
      .then((data: { signedIn?: boolean; payment?: FirstJob["payment"]; job?: FirstJob | null }) => {
        setSignedIn(Boolean(data.signedIn))
        if (data.payment) setPayment(data.payment)
        if (data.job?.answers) setAnswers(data.job.answers)
      })
      .catch(() => setSignedIn(false))
  }, [])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError("")
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    })
    const data = (await response.json()) as { error?: string }
    setBusy(false)
    if (!response.ok) {
      setError(data.error || "Could not save the draft.")
      return
    }
    window.location.href = "/start/preview"
  }

  if (signedIn === null) return <p className="text-sm text-ink-soft">Checking the workspace.</p>
  if (!signedIn) {
    return (
      <div className="rounded-[1.75rem] border border-ink/10 bg-card p-6">
        <p>Sign in with the same email you used at PayPal. That is how this job stays yours.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login?next=/start/brief" className="btn btn-signal">Sign in</Link>
          <Link href="/signup?next=/start/brief" className="btn btn-ghost">Create the account</Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <p className="text-sm text-ink-soft">
        {payment === "confirmed"
          ? "PayPal has confirmed a membership on this account. Ava will draft from these answers and wait."
          : "PayPal has not confirmed a membership on this account yet. You can still draft. The desk will show the payment as not confirmed until it lands."}
      </p>
      {fields.map((field) => (
        <label key={field.key} className="grid gap-1 text-sm">
          {field.label}
          <input
            required
            minLength={2}
            value={answers[field.key]}
            placeholder={field.placeholder}
            onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))}
            className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
          />
        </label>
      ))}
      {error ? <p className="text-sm text-signal">{error}</p> : null}
      <button type="submit" className="btn btn-signal w-fit" disabled={busy}>
        {busy ? "Drafting" : "Draft the campaign"}
      </button>
    </form>
  )
}

export function FirstPreview() {
  const [job, setJob] = useState<FirstJob | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch("/api/start")
      .then((response) => response.json())
      .then((data: { signedIn?: boolean; job?: FirstJob | null; error?: string }) => {
        setSignedIn(Boolean(data.signedIn))
        setJob(data.job ?? null)
        if (data.error) setError(data.error)
      })
      .catch(() => setSignedIn(false))
  }, [])

  async function approve() {
    setBusy(true)
    setError("")
    const response = await fetch("/api/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    })
    const data = (await response.json()) as { job?: FirstJob; error?: string }
    setBusy(false)
    if (!response.ok || !data.job) {
      setError(data.error || "Could not approve.")
      return
    }
    setJob(data.job)
  }

  if (signedIn === null) return <p className="text-sm text-ink-soft">Opening the draft.</p>
  if (!signedIn) return <Link href="/login?next=/start/preview" className="btn btn-signal">Sign in</Link>
  if (!job) return <p>No draft yet. <Link className="underline" href="/start/brief">Answer the five questions.</Link></p>

  return (
    <div className="grid gap-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-signal">
        {job.status === "live" ? "Live in your studio" : "Draft, waiting on your yes"}
        {job.payment === "confirmed" ? " · Paid" : " · Payment not confirmed"}
      </p>
      <article className="rounded-[1.75rem] border border-ink/10 bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Page</p>
        <h2 className="mt-3 font-serif text-4xl">{job.draft.headline}</h2>
        <p className="mt-3 text-lg">{job.draft.subhead}</p>
        <ul className="mt-5 space-y-2 text-ink-soft">
          {job.draft.page.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <p className="mt-5 text-sm">Lead form: {job.draft.formFields.join(", ")}</p>
      </article>
      <div className="grid gap-4">
        {job.draft.emails.map((email, index) => (
          <article key={email.subject} className="rounded-[1.75rem] border border-ink/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">Email {index + 1}</p>
            <h3 className="mt-2 font-serif text-2xl">{email.subject}</h3>
            <p className="mt-3 text-ink-soft">{email.body}</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-ink-soft">
        Approve locks this as the live job. It does not email anyone and it does not put a new public website online. Ava will not replace it unless you send a change.
      </p>
      {error ? <p className="text-sm text-signal">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        {job.status === "live" ? null : (
          <button type="button" className="btn btn-signal" disabled={busy} onClick={() => void approve()}>
            {busy ? "Saving" : "Approve"}
          </button>
        )}
        <Link href="/start/brief" className="btn btn-ghost">Change</Link>
      </div>
    </div>
  )
}
