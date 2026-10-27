"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

export function BetaFeedback() {
  const pathname = usePathname()
  const [beta, setBeta] = useState(false)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    if (!supabase) return
    let cancelled = false
    void (async () => {
      await fetch("/api/beta/claim", { method: "POST" })
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (!userId || cancelled) return
      const seat = await supabase
        .from("seats")
        .select("is_beta")
        .eq("user_id", userId)
        .eq("status", "active")
        .eq("is_beta", true)
        .maybeSingle()
      if (!cancelled && seat.data?.is_beta) setBeta(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!beta) return null

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note, page: pathname }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) setMessage(body.error || "Could not send that.")
      else {
        setNote("")
        setOpen(false)
        setMessage("Sent. The owner can read it in the office.")
      }
    } catch {
      setMessage("Could not send that.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      {open ? (
        <form onSubmit={(event) => void send(event)} className="mb-2 grid gap-2 rounded-3xl border border-ink/15 bg-card p-4 shadow-lg">
          <p className="text-sm font-medium">What&apos;s missing / what broke</p>
          <textarea
            required
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-24 rounded-2xl border border-ink/15 px-3 py-2 text-sm"
            placeholder="One note is enough."
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-signal" disabled={busy}>{busy ? "Sending…" : "Send"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Close</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-signal" onClick={() => { setOpen(true); setMessage("") }}>
          What&apos;s missing / what broke
        </button>
      )}
      {message && !open ? <p className="mt-2 rounded-2xl bg-card px-3 py-2 text-sm shadow">{message}</p> : null}
    </div>
  )
}
