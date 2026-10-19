"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export type CampaignRow = {
  id: string
  ownerId: string
  name: string
  channel: string
  status: string
  brief: string
}

export type AccountOption = { id: string; label: string }

const CHANNELS = ["email", "search", "social", "site"] as const
const NEXT: Record<string, string> = { draft: "active", active: "paused", paused: "draft" }

export function CampaignDesk({
  campaigns,
  accounts,
  ownerId,
}: {
  campaigns: CampaignRow[]
  accounts: AccountOption[]
  ownerId: string
}) {
  const router = useRouter()
  const [account, setAccount] = useState(accounts[0]?.id || ownerId)
  const [name, setName] = useState("")
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("email")
  const [brief, setBrief] = useState("")
  const [notice, setNotice] = useState("")
  const [pending, setPending] = useState(false)
  const labels = new Map(accounts.map((item) => [item.id, item.label]))

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
        setNotice(data.error || "That campaign was not saved.")
        return
      }
      setName("")
      setBrief("")
      setNotice("Saved on digimark101.com. Open that account’s studio to see it.")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Campaigns</h1>
      <p className="mt-3 max-w-2xl text-muted">
        These are the campaigns on digimark101.com. There is no seat cap on this desk. Active means the record is live in that account’s studio. It does not buy ads or send mail.
      </p>
      <form
        className="mt-8 grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void save({ action: "create_campaign", workspaceId: account, name, channel, brief })
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
          Save on digimark101.com
        </button>
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      <ul className="mt-8 grid gap-3">
        {campaigns.length === 0 ? <li className="text-muted">No campaigns yet.</li> : null}
        {campaigns.map((campaign) => (
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
