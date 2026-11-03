"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export type SequenceRow = {
  id: string
  accountId: string
  name: string
  steps: string
  status: string
  productKey: string
}

export type StoreAccount = { id: string; label: string }

const STATUSES = ["draft", "ready", "archived"] as const

export function SequenceDesk({
  items,
  accounts,
  accountId,
  productKey,
}: {
  items: SequenceRow[]
  accounts: StoreAccount[]
  accountId: string
  productKey: string
}) {
  const router = useRouter()
  const account = accounts.find((item) => item.id === accountId) ?? accounts[0]
  const [name, setName] = useState("")
  const [steps, setSteps] = useState("")
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("draft")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  const visible = items.filter((item) => item.accountId === account?.id && (!item.productKey || item.productKey === productKey))

  async function save(body: Record<string, unknown>) {
    setPending(true)
    setNotice("")
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, ...body }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setNotice(data.error || "That sequence was not saved.")
        return
      }
      setName("")
      setSteps("")
      setNotice("Saved.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Mail sequences</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Stored copy for {account?.label || "this account"}. Nothing here is sent. Every client account has its own sequence space.
      </p>
      {accounts.length > 1 ? (
        <label className="mt-6 grid max-w-sm gap-1 text-sm">
          Account
          <select
            className="rounded-full border border-border bg-transparent px-4 py-2"
            value={account?.id || ""}
            onChange={(event) => router.push(`/sequences?account=${event.target.value}`)}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <form
        className="mt-8 grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void save({
            action: "create_sequence",
            name,
            steps,
            status,
            product: productKey,
            accountId: account?.id,
          })
        }}
      >
        <label className="grid gap-1 text-sm">
          Name
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Welcome, or beta invite" required />
        </label>
        <label className="grid gap-1 text-sm">
          Status
          <select className="rounded-full border border-border bg-transparent px-4 py-2" value={status} onChange={(event) => setStatus(event.target.value as (typeof STATUSES)[number])}>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Emails
          <textarea className="min-h-40 rounded-3xl border border-border bg-transparent px-4 py-3" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="Subject and body for each email, in order." required />
        </label>
        <button type="submit" className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || name.trim().length < 2 || steps.trim().length < 2}>
          Save sequence
        </button>
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <ul className="mt-8 grid gap-3">
        {visible.length === 0 ? <li className="text-muted">No mail sequences in this account yet.</li> : null}
        {visible.map((item) => (
          <li key={item.id} className="rounded-3xl border border-border bg-surface p-4">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted">{item.status}</p>
            <pre className="mt-3 max-w-2xl whitespace-pre-wrap text-sm">{item.steps}</pre>
          </li>
        ))}
      </ul>
    </section>
  )
}
