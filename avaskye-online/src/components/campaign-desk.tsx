"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { HUB_PRODUCTS, hubProduct } from "@/lib/products"
import Link from "next/link"

export type CampaignRow = {
  id: string
  ownerId: string
  name: string
  channel: string
  status: string
  brief: string
  productKey: string
}

export type AccountOption = { id: string; label: string }

const CHANNELS = ["email", "search", "social", "site"] as const
const NEXT: Record<string, string> = { draft: "active", active: "paused", paused: "draft" }
const DRAFT_KEY = "ava_office_campaign_draft"

export function CampaignDesk({
  campaigns,
  accounts,
  ownerId,
  productKey,
}: {
  campaigns: CampaignRow[]
  accounts: AccountOption[]
  ownerId: string
  productKey: string
}) {
  const router = useRouter()
  const product = hubProduct(productKey)
  const [account, setAccount] = useState(accounts[0]?.id || ownerId)
  const [name, setName] = useState("")
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("email")
  const [brief, setBrief] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  const labels = new Map(accounts.map((item) => [item.id, item.label]))
  const visible = campaigns.filter((campaign) => !campaign.productKey || campaign.productKey === product.key)

  // Persist form draft in localStorage so inputs stay across refreshes or failed saves
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved) as { name?: string; channel?: string; brief?: string; account?: string }
        if (draft.name) setName(draft.name)
        if (draft.channel && CHANNELS.includes(draft.channel as any)) setChannel(draft.channel as any)
        if (draft.brief) setBrief(draft.brief)
        if (draft.account) setAccount(draft.account)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, channel, brief, account }))
    } catch {}
  }, [name, channel, brief, account])

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
        setNotice(data.error || "That campaign was not saved. Your inputs are still here so you can try again or edit.")
        return
      }
      setName("")
      setBrief("")
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      setNotice("Saved on digimark101.com. You can edit it later in the studio or here. Open that account’s studio to see it.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Campaigns</h1>
      <p className="mt-3 max-w-2xl text-muted">
        These campaigns belong to {product.name}. There is no seat cap on this desk. Active means the record is live in that account’s studio. It does not buy ads or send mail. Drafts you type stay in this form until you save or clear them.
      </p>
      <p className="mt-2 text-sm">
        <Link href="/social" className="underline">Open free social plays</Link> for Facebook, TikTok, Instagram, and YouTube. Save any play here as a campaign (you can change it later).
      </p>
      {HUB_PRODUCTS.length > 1 ? (
        <label className="mt-6 grid max-w-sm gap-1 text-sm">
          Product
          <select
            className="rounded-full border border-border bg-transparent px-4 py-2"
            value={product.key}
            onChange={(event) => router.push(`/campaigns?product=${event.target.value}`)}
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
          void save({ action: "create_campaign", workspaceId: account, name, channel, brief, product: product.key })
        }}
      >
        <label className="grid gap-1 text-sm">
          Account on digimark101.com
          <select className="rounded-full border border-border bg-transparent px-4 py-2" value={account} onChange={(event) => setAccount(event.target.value)}>
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Name
          <input className="rounded-full border border-border bg-transparent px-4 py-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="October offer" />
        </label>
        <label className="grid gap-1 text-sm">
          Channel
          <select className="rounded-full border border-border bg-transparent px-4 py-2" value={channel} onChange={(event) => setChannel(event.target.value as (typeof CHANNELS)[number])}>
            {CHANNELS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Brief
          <textarea className="min-h-24 rounded-3xl border border-border bg-transparent px-4 py-3" value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="The one job of this campaign" />
        </label>
        <button type="submit" className="w-fit rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || name.trim().length < 2}>
          Save on digimark101.com (editable later)
        </button>
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <ul className="mt-8 grid gap-3">
        {visible.length === 0 ? <li className="text-muted">No campaigns yet. Your form draft stays here until you save.</li> : null}
        {visible.map((campaign) => (
          <li key={campaign.id} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{campaign.name}</p>
                <p className="text-sm text-muted">
                  {labels.get(campaign.ownerId) || "Account"} · {campaign.channel} · {campaign.status}
                </p>
                {campaign.brief ? <p className="mt-2 max-w-xl text-sm">{campaign.brief}</p> : null}
                <a className="mt-2 inline-block text-sm underline" href={`https://www.digimark101.com/studio/campaigns?workspace=${encodeURIComponent(campaign.ownerId)}`}>
                  Open this account in the studio
                </a>
              </div>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-sm"
                disabled={pending}
                onClick={() => void save({ action: "set_campaign_status", id: campaign.id, status: NEXT[campaign.status] || "active" })}
              >
                {campaign.status}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
