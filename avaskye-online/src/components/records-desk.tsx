"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export type OfficeRecord = {
  id: string
  kind: string
  title: string
  party: string
  amount: string
  currency: string
  status: string
  notes: string
  occurredOn: string
}

const KINDS = ["invoice", "expense", "record", "legal"] as const
const NEXT: Record<string, string> = { open: "paid", paid: "filed", filed: "open" }

export function RecordsDesk({ records }: { records: OfficeRecord[] }) {
  const router = useRouter()
  const [kind, setKind] = useState<(typeof KINDS)[number]>("invoice")
  const [title, setTitle] = useState("")
  const [party, setParty] = useState("")
  const [amount, setAmount] = useState("")
  const [occurredOn, setOccurredOn] = useState("")
  const [notes, setNotes] = useState("")
  const [filter, setFilter] = useState("all")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)

  const shown = filter === "all" ? records : records.filter((row) => row.kind === filter)

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
        setNotice(data.error || "That record was not saved.")
        return
      }
      setTitle("")
      setParty("")
      setAmount("")
      setNotes("")
      setNotice("Saved in the office books.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Records</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Invoices, expenses, and the rest of the office paper. Only this desk can see them. Nothing here is sent to a client.
      </p>
      <form
        className="mt-8 grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void save({ action: "create_record", kind, title, party, amount, occurredOn, notes })
        }}
      >
        <label className="grid gap-1 text-sm">
          Kind
          <select className="rounded-full border border-border bg-transparent px-4 py-2" value={kind} onChange={(event) => setKind(event.target.value as (typeof KINDS)[number])}>
            {KINDS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Title
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="October hosting" />
        </label>
        <label className="grid gap-1 text-sm">
          Who
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={party} onChange={(event) => setParty(event.target.value)} placeholder="Client or vendor" />
        </label>
        <label className="grid gap-1 text-sm">
          Amount
          <input className="rounded-full border border-border bg-transparent px-4 py-2" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
        </label>
        <label className="grid gap-1 text-sm">
          Date
          <input className="rounded-full border border-border bg-transparent px-4 py-2" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Notes
          <textarea className="min-h-24 rounded-3xl border border-border bg-transparent px-4 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button type="submit" className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || title.trim().length < 2}>
          Save record
        </button>
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        {["all", ...KINDS].map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 ${filter === item ? "bg-accent text-accent-fg" : "border border-border"}`} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-3">
        {shown.length === 0 ? <li className="text-muted">Nothing filed in this shelf yet.</li> : null}
        {shown.map((row) => (
          <li key={row.id} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-sm text-muted">
                  {row.kind} · {row.party || "No name"} · {row.amount ? `${row.currency} ${row.amount}` : "No amount"} · {row.occurredOn || "No date"}
                </p>
                {row.notes ? <p className="mt-2 max-w-xl text-sm">{row.notes}</p> : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-sm"
                disabled={pending}
                onClick={() => void save({ action: "set_record_status", id: row.id, status: NEXT[row.status] || "open" })}
              >
                {row.status}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
