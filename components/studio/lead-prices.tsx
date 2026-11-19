"use client"

import { useState } from "react"

export function LeadPrices({
  rows,
}: {
  rows: { key: string; label: string; price: string; pack: string }[]
}) {
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice("")
    setError("")
    const form = new FormData(event.currentTarget)
    const response = await fetch("/api/studio/lead-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche: String(form.get("niche") || ""),
        amount: String(form.get("amount") || ""),
        packSize: String(form.get("packSize") || ""),
      }),
    })
    const body = (await response.json()) as { error?: string; summary?: string }
    if (!response.ok) {
      setError(body.error || "Could not save that price.")
      return
    }
    setNotice(body.summary || "Saved.")
  }

  return (
    <form onSubmit={save} className="mt-8 max-w-xl rounded-3xl border border-ink/10 bg-card p-5">
      <h2 className="font-serif text-3xl">Marketplace price</h2>
      <p className="mt-2 text-sm text-ink-soft">Sets what a buyer pays on appdm101.online. Personal lead details stay hidden until the order is paid.</p>
      <label className="mt-4 block text-sm">
        Niche
        <select name="niche" className="mt-1 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2" defaultValue={rows[0]?.key}>
          {rows.map((row) => (
            <option key={row.key} value={row.key}>
              {row.label}
              {row.price ? ` · ${row.price}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm">
        Price in dollars
        <input name="amount" inputMode="decimal" className="mt-1 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2" required />
      </label>
      <label className="mt-3 block text-sm">
        Leads in the pack
        <input name="packSize" inputMode="numeric" defaultValue={rows[0]?.pack || "25"} className="mt-1 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2" required />
      </label>
      <button className="btn btn-signal mt-4" type="submit">
        Save price
      </button>
      {notice ? <p className="mt-3 text-sm text-signal">{notice}</p> : null}
      {error ? <p className="mt-3 text-sm text-signal">{error}</p> : null}
    </form>
  )
}
