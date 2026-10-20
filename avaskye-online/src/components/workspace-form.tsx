"use client"

import { useState } from "react"
import { ConfirmButton } from "@/components/confirm-button"

export function WorkspaceForm({ kind }: { kind: "calendar" | "memory" }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const fields = kind === "calendar"
    ? [{ key: "title", label: "Appointment title" }, { key: "startsAt", label: "Start time with timezone (2026-10-22T14:00:00-04:00)" }, { key: "contactName", label: "Contact name" }, { key: "notes", label: "Notes" }]
    : [{ key: "memoryKey", label: "Memory key" }, { key: "memoryValue", label: "Memory value (replaces an existing value for this key)" }]
  return (
    <div className="mt-6 rounded-3xl border border-border bg-surface p-5">
      <h2 className="text-2xl">{kind === "calendar" ? "Book an appointment" : "Save workspace memory"}</h2>
      <p className="mt-2 text-sm text-muted">Leave customer ID blank for your own workspace. This changes shared data only; no email or external calendar invitation is sent.</p>
      <div className="mt-4 grid gap-3">
        {[{ key: "customerId", label: "Customer account UUID (optional)" }, ...fields].map((field) => <label className="grid gap-1 text-sm" key={field.key}>{field.label}<input maxLength={field.key === "notes" || field.key === "memoryValue" ? 2000 : 160} className="rounded-xl border border-border bg-bg p-3" value={values[field.key] || ""} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /></label>)}
        <ConfirmButton key={JSON.stringify(values)} label="Review save" confirmLabel="Confirm shared workspace change" body={{ ...values, action: kind === "calendar" ? "book_appointment" : "save_memory" }} />
      </div>
    </div>
  )
}
