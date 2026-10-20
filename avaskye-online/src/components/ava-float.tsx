"use client"

import { useEffect, useState, type FormEvent } from "react"

const RELAXED = [
  { id: "satin", src: "/ava/float-satin.png", label: "Black satin" },
  { id: "emerald", src: "/ava/float-emerald.png", label: "Emerald silk" },
]
const PROFESSIONAL = { id: "professional", src: "/ava/float-professional.png", label: "Professional" }

function officeLook(visitor: boolean) {
  if (visitor) return PROFESSIONAL
  const day = Math.floor(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) / 86400000)
  return RELAXED[((day % RELAXED.length) + RELAXED.length) % RELAXED.length]
}

export function AvaFloat() {
  const [open, setOpen] = useState(false)
  const [visitor, setVisitor] = useState(false)
  const [text, setText] = useState("")
  const [reply, setReply] = useState("Click me when you want help. I will not save anything until you confirm.")
  const [pending, setPending] = useState(false)
  const look = officeLook(visitor)

  useEffect(() => {
    fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { visitorMode?: boolean }) => setVisitor(Boolean(data.visitorMode)))
      .catch(() => setVisitor(false))
  }, [])

  async function send(event: FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content || pending) return
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      setReply(response.ok ? data.reply || "Done." : data.error || "I could not answer that.")
      if (response.ok) setText("")
    } catch {
      setReply("I could not reach the office guide.")
    } finally {
      setPending(false)
    }
  }

  if (open) {
    return (
      <section className="fixed bottom-3 right-3 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-2xl" aria-label="Ask Ava">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Ava Skye <span className="text-muted">· {look.label}</span></p>
          <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" onClick={() => setOpen(false)}>Close</button>
        </div>
        <p className="text-sm text-muted">{reply}</p>
        <form className="flex gap-2" onSubmit={send}>
          <label className="sr-only" htmlFor="ava-float-help">Ask Ava</label>
          <input id="ava-float-help" value={text} onChange={(event) => setText(event.target.value)} placeholder="Open campaigns, or draft a contact" className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-accent px-3 py-2 text-sm text-accent-fg" disabled={pending || !text.trim()}>{pending ? "…" : "Ask"}</button>
        </form>
      </section>
    )
  }

  return (
    <button type="button" className="fixed bottom-2 right-2 z-50 w-36 border-0 bg-transparent p-0 sm:w-40" onClick={() => setOpen(true)} aria-label={`Ask Ava for help. She is in ${look.label}.`}>
      <img src={look.src} alt="" className="h-auto w-full drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)]" />
    </button>
  )
}
