"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { HUB_PRODUCTS, hubProduct } from "@/lib/products"

export type StoreAccount = { id: string; label: string }

export type MediaRow = {
  id: string
  kind: string
  title: string
  url: string
  notes: string
  status: string
  productKey: string
  accountId: string
  usedOn: string
}

const KINDS = ["image", "video", "copy", "creative", "document", "other"] as const
const STATUSES = ["planned", "used", "archived"] as const
const NEXT: Record<string, string> = { planned: "used", used: "archived", archived: "planned" }

export function MediaDesk({
  items,
  productKey,
  accounts,
  accountId,
  ownerId,
}: {
  items: MediaRow[]
  productKey: string
  accounts: StoreAccount[]
  accountId: string
  ownerId: string
}) {
  const router = useRouter()
  const product = hubProduct(productKey)
  const account = accounts.find((item) => item.id === accountId) ?? accounts[0]
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<(typeof KINDS)[number]>("image")
  const [url, setUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("planned")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  const visible = items.filter((item) => {
    const sameProduct = !item.productKey || item.productKey === product.key
    const sameAccount = item.accountId ? item.accountId === account?.id : account?.id === ownerId
    return sameProduct && sameAccount
  })

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
        setNotice(data.error || "That item was not saved.")
        return
      }
      setTitle("")
      setUrl("")
      setNotes("")
      setNotice("Saved.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Media & Assets</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Save media, creatives, copy, and file links for {account?.label || product.name}. Each client account has its own media space. These stay in the office. They do not publish anywhere.
      </p>
      {accounts.length > 1 ? (
        <label className="mt-6 grid max-w-sm gap-1 text-sm">
          Account
          <select
            className="rounded-full border border-border bg-transparent px-4 py-2"
            value={account?.id || ""}
            onChange={(event) => router.push(`/media?product=${product.key}&account=${event.target.value}`)}
          >
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      {HUB_PRODUCTS.length > 1 ? (
        <label className="mt-6 grid max-w-sm gap-1 text-sm">
          Product
          <select
            className="rounded-full border border-border bg-transparent px-4 py-2"
            value={product.key}
            onChange={(event) => router.push(`/media?product=${event.target.value}&account=${account?.id || ""}`)}
          >
            {HUB_PRODUCTS.map((item) => (
              <option key={item.key} value={item.key}>{item.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <form
        className="mt-8 grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void save({
            action: "create_media",
            title,
            kind,
            url,
            notes,
            status,
            product: product.key,
            accountId: account?.id,
          })
        }}
      >
        <label className="grid gap-1 text-sm">
          Title
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hero image or email sequence" required />
        </label>
        <label className="grid gap-1 text-sm">
          Kind
          <select className="rounded-full border border-border bg-transparent px-4 py-2" value={kind} onChange={(event) => setKind(event.target.value as (typeof KINDS)[number])}>
            {KINDS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Link or file URL
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://… or drive link" />
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
          Notes
          <textarea className="min-h-24 rounded-3xl border border-border bg-transparent px-4 py-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Where it was used, or the plan for it" />
        </label>
        <button type="submit" className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || title.trim().length < 2}>
          Save asset
        </button>
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <ul className="mt-8 grid gap-3">
        {visible.length === 0 ? <li className="text-muted">No media or assets yet.</li> : null}
        {visible.map((item) => (
          <li key={item.id} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">
                  {item.kind} · {item.status}{item.usedOn ? ` · used ${item.usedOn}` : ""}
                </p>
                {item.url ? (
                  <a className="mt-1 inline-block text-sm underline" href={item.url} target="_blank" rel="noreferrer">
                    {item.url}
                  </a>
                ) : null}
                {item.notes ? <p className="mt-2 max-w-xl text-sm">{item.notes}</p> : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-sm"
                disabled={pending}
                onClick={() => void save({ action: "set_media_status", id: item.id, status: NEXT[item.status] || "planned" })}
              >
                {item.status}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
