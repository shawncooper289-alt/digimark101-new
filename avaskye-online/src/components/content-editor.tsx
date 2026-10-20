"use client"

import { useState } from "react"
import { ConfirmButton } from "@/components/confirm-button"

export function ContentEditor({ id, initialName, initialHeadline }: { id: string; initialName: string; initialHeadline: string }) {
  const [name, setName] = useState(initialName)
  const [headline, setHeadline] = useState(initialHeadline)
  return (
    <div className="mt-4 grid gap-3">
      <label className="grid gap-1 text-sm">Site name
        <input className="rounded-xl border border-border bg-bg p-3" value={name} maxLength={160} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">Headline
        <textarea className="rounded-xl border border-border bg-bg p-3" value={headline} maxLength={500} onChange={(event) => setHeadline(event.target.value)} />
      </label>
      <ConfirmButton key={`${name}\n${headline}`} label="Review save" confirmLabel="Confirm shared content change" body={{ action: "update_site_content", id, name, headline }} />
    </div>
  )
}
