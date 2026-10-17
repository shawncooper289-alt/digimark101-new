"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function ConfirmButton({
  label,
  confirmLabel,
  body,
}: {
  label: string
  confirmLabel: string
  body: Record<string, unknown>
}) {
  const router = useRouter()
  const [armed, setArmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, confirmed: true }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(data.error || "Nothing was saved.")
        return
      }
      setArmed(false)
      router.refresh()
    } catch {
      setError("Nothing was saved.")
    } finally {
      setPending(false)
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" disabled={pending} onClick={() => (armed ? void save() : setArmed(true))}>
        {pending ? "Saving…" : armed ? confirmLabel : label}
      </button>
      {armed ? <button type="button" className="text-sm text-muted" onClick={() => setArmed(false)}>Cancel</button> : null}
      {error ? <span className="text-sm">{error}</span> : null}
    </span>
  )
}
