"use client"

import { useState } from "react"

export function OptOutForm() {
  const [email, setEmail] = useState("")
  const [deletion, setDeletion] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "unconfigured" | "error">("idle")

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus("sending")
    try {
      const response = await fetch("/api/leads/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, deletion }),
      })
      const data = (await response.json()) as { ok?: boolean; reason?: string }
      if (!response.ok) {
        setStatus("error")
        return
      }
      setStatus(data.reason === "unconfigured" || data.ok === false ? "unconfigured" : "done")
    } catch {
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-3xl border border-ink/10 bg-card p-6" role="status">
        That request is recorded. The address is on the suppression list{deletion ? " and matching stored contact details were deleted" : ""}.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-ink/10 bg-card p-6">
      <label className="grid gap-1.5 text-sm">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={deletion} onChange={(event) => setDeletion(event.target.checked)} className="mt-1" />
        <span>Also delete stored contact details for this address, not only future mail and list sharing.</span>
      </label>
      {status === "unconfigured" ? (
        <p className="text-sm text-ink-soft" role="status">
          The suppression list is not connected on this deployment yet. Email hello@digimark101.com and the studio will record it.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-signal" role="alert">
          That request could not be saved. Email hello@digimark101.com.
        </p>
      ) : null}
      <button type="submit" className="btn btn-signal w-fit" disabled={status === "sending"}>
        {status === "sending" ? "Saving…" : deletion ? "Delete and unsubscribe" : "Unsubscribe"}
      </button>
    </form>
  )
}
