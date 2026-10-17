"use client"

import { useState } from "react"

export function ConfirmOrder() {
  const [orderId, setOrderId] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    setMessage("")
    try {
      const response = await fetch("/api/leads/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", orderId }),
      })
      const data = (await response.json()) as { ok?: boolean; released?: number }
      if (!response.ok || !data.ok) {
        setMessage("That order could not be marked paid.")
        return
      }
      setMessage(`Marked paid. ${data.released ?? 0} premium contacts can be released to the buyer. This page does not show them.`)
    } catch {
      setMessage("That order could not be marked paid.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      className="mt-8 rounded-3xl border border-ink/10 bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        void confirm()
      }}
    >
      <h2 className="font-serif text-2xl">Mark an order paid</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Payment capture is not connected. Recording a paid order releases that niche&apos;s current premium list to the buyer. It does not show addresses here.
      </p>
      <label className="mt-4 grid gap-1.5 text-sm">
        Order reference
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          required
          className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"
        />
      </label>
      <button type="submit" className="btn btn-signal mt-4" disabled={pending}>
        {pending ? "Saving…" : "Mark paid"}
      </button>
      {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
    </form>
  )
}
