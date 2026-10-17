"use client"

import { useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"

const REGIONS = ["us-east-1", "us-west-1", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"]

type Backend = {
  id: string
  name: string
  region: string
  status: string
  apiUrl: string
  projectRef: string
}

export function ManagedBackend({
  configured,
  owner,
  backends,
}: {
  configured: boolean
  owner: boolean
  backends: Backend[]
}) {
  const [name, setName] = useState("")
  const [region, setRegion] = useState("us-east-1")
  const [siteUrl, setSiteUrl] = useState("")
  const [drafted, setDrafted] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  useAvaForm((fills) => {
    if (fills.name) setName(fills.name)
    if (fills.region && REGIONS.includes(fills.region)) setRegion(fills.region)
    if (fills.site || fills.website) setSiteUrl(fills.site || fills.website)
    setDrafted(true)
    setConfirmed(false)
  })

  async function save() {
    setPending(true)
    setMessage("")
    try {
      const response = await fetch("/api/managed/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, region, siteUrl, confirmed: true }),
      })
      const data = (await response.json()) as { ok?: boolean; reason?: string }
      if (!response.ok || !data.ok) {
        setMessage(data.reason === "unconfigured" ? "Managed backend is not configured." : "That backend could not be provisioned.")
        return
      }
      setMessage("Backend requested. Status is on this page. Keys stay on the server.")
      setConfirmed(true)
    } catch {
      setMessage("That backend could not be provisioned.")
    } finally {
      setPending(false)
    }
  }

  if (!configured) {
    return (
      <p className="mt-8 max-w-2xl rounded-3xl border border-ink/10 bg-card p-5 text-ink-soft">
        Managed backend is not configured. DigiMark101 can provision a Supabase project per workspace once the organization id and a management token, or OAuth app credentials, are set on the server.
      </p>
    )
  }

  return (
    <div className="mt-8 grid gap-6">
      {backends.length > 0 ? (
        <ul className="grid gap-3">
          {backends.map((backend) => (
            <li key={backend.id} className="rounded-3xl border border-ink/10 bg-card p-4">
              <p className="font-medium">{backend.name}</p>
              <p className="text-sm text-ink-soft">
                {backend.region} · {backend.status}
                {owner ? ` · ${backend.projectRef}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">{owner ? "No workspace backend has been provisioned yet." : "This workspace does not have a managed backend yet."}</p>
      )}
      <form
        className="grid max-w-lg gap-3 rounded-3xl border border-ink/10 bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault()
          if (!confirmed) {
            setDrafted(true)
            setConfirmed(true)
            return
          }
          void save()
        }}
      >
        <h2 className="font-serif text-2xl">Provision a backend</h2>
        <p className="text-sm text-ink-soft">Ava can draft the name and region. Confirm the draft, then save. The database password and API keys are not shown here.</p>
        <label className="grid gap-1 text-sm">
          Workspace name
          <input data-ava-field="name" value={name} onChange={(event) => { setName(event.target.value); setConfirmed(false) }} required className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink" />
        </label>
        <label className="grid gap-1 text-sm">
          Region
          <select data-ava-field="region" value={region} onChange={(event) => { setRegion(event.target.value); setConfirmed(false) }} className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink">
            {REGIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Site URL
          <input data-ava-field="site" value={siteUrl} onChange={(event) => { setSiteUrl(event.target.value); setConfirmed(false) }} placeholder="https://" className="min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink" />
        </label>
        {drafted && !confirmed ? <p className="text-sm text-signal">Review these fields. Confirm them before anything is saved.</p> : null}
        {confirmed ? <p className="text-sm text-ink-soft">Confirmed. Save when this looks right. Editing a field asks you to confirm again.</p> : null}
        <button className="btn btn-signal w-fit" type="submit" disabled={pending}>
          {pending ? "Saving…" : confirmed ? "Save backend" : "Confirm draft"}
        </button>
        {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
      </form>
    </div>
  )
}
