"use client"

import Link from "next/link"
import { useState } from "react"

export function RequestList({ niche, signedIn }: { niche: string; signedIn: boolean }) {
  const [message, setMessage] = useState("")
  const [orderId, setOrderId] = useState("")
  const [pending, setPending] = useState(false)

  async function requestList() {
    setPending(true)
    setMessage("")
    try {
      const response = await fetch("/api/leads/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      })
      const data = (await response.json()) as { ok?: boolean; orderId?: string }
      if (response.status === 401 || !signedIn) {
        setMessage("Sign in to request this list. Signing in does not buy it.")
        return
      }
      if (!response.ok || !data.ok || !data.orderId) {
        setMessage("The request could not be saved.")
        return
      }
      setOrderId(data.orderId)
      setMessage("Request saved. This page does not collect payment, so contact details stay hidden.")
    } catch {
      setMessage("The request could not be saved.")
    } finally {
      setPending(false)
    }
  }

  if (!signedIn) {
    return (
      <p className="mt-4 text-sm text-ink-soft">
        <Link className="underline" href="/login">
          Sign in
        </Link>{" "}
        to request this list. A request is not a purchase.
      </p>
    )
  }

  return (
    <div className="mt-4">
      <button type="button" className="btn btn-signal" onClick={() => void requestList()} disabled={pending}>
        {pending ? "Requesting…" : "Request this list"}
      </button>
      {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
      {orderId ? <p className="mt-2 text-xs text-ink-soft">Order reference: {orderId}</p> : null}
    </div>
  )
}

type ReleasedContact = { name: string; email: string; phone: string; company: string }

export function ReleaseList({ signedIn }: { signedIn: boolean }) {
  const [orderId, setOrderId] = useState("")
  const [message, setMessage] = useState("")
  const [contacts, setContacts] = useState<ReleasedContact[] | null>(null)
  const [pending, setPending] = useState(false)

  async function release() {
    setPending(true)
    setMessage("")
    setContacts(null)
    try {
      const response = await fetch("/api/leads/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", orderId }),
      })
      const data = (await response.json()) as { ok?: boolean; reason?: string; contacts?: ReleasedContact[] }
      if (response.status === 401) {
        setMessage("Sign in with the account that requested the list.")
        return
      }
      if (data.reason === "unpaid" || response.status === 402) {
        setMessage("Contact details stay hidden until that order is paid.")
        return
      }
      if (!response.ok || !data.ok) {
        setMessage("That order could not be opened.")
        return
      }
      setContacts(data.contacts ?? [])
      setMessage(data.contacts?.length ? "Paid order. These contacts were released to this account." : "Paid order. No contacts are attached yet.")
    } catch {
      setMessage("That order could not be opened.")
    } finally {
      setPending(false)
    }
  }

  if (!signedIn) return null

  return (
    <form
      className="mt-10 rounded-3xl border border-ink/10 bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault()
        void release()
      }}
    >
      <h2 className="font-serif text-2xl">Open a paid order</h2>
      <p className="mt-2 text-sm text-ink-soft">Use the order reference from your request. Unpaid orders return no contact details.</p>
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
        {pending ? "Checking…" : "Open paid order"}
      </button>
      {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
      {contacts && contacts.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm">
          {contacts.map((contact) => (
            <li key={contact.email} className="border-t border-ink/10 pt-3">
              <p className="font-medium">{contact.name || "Unnamed"}</p>
              <p>{contact.email}</p>
              {contact.phone ? <p>{contact.phone}</p> : null}
              {contact.company ? <p className="text-ink-soft">{contact.company}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
