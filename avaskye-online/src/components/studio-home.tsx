"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { visitorModeIntent } from "@/lib/appearance-command"

const LOOKS = [
  { id: "satin", label: "Black satin", src: "/ava/satin.jpg" },
  { id: "knit", label: "Black knit", src: "/ava/knit.jpg" },
  { id: "emerald", label: "Emerald silk", src: "/ava/emerald.jpg" },
  { id: "vest", label: "Ivory shirt", src: "/ava/vest.jpg" },
] as const

const PROFESSIONAL = { id: "professional", label: "Professional", src: "/ava/professional.jpg" }

const TABLES = [
  { href: "/leads", label: "Leads" },
  { href: "/crm", label: "CRM" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/automations", label: "Automations" },
  { href: "/billing", label: "Billing" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
  { href: "/tools", label: "Tools" },
  { href: "/settings", label: "Settings" },
] as const

function todayLook() {
  const now = new Date()
  const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000)
  return LOOKS[((day % LOOKS.length) + LOOKS.length) % LOOKS.length]
}

export function StudioHome() {
  const router = useRouter()
  const [visitors, setVisitors] = useState(false)
  const [table, setTable] = useState<(typeof TABLES)[number]["href"]>(TABLES[0].href)
  const [prompt, setPrompt] = useState("")
  const [reply, setReply] = useState("Tell me which table to run. I open it. I do not publish or save until you say yes.")
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<{ name: string; email?: string; company?: string } | null>(null)
  const current = TABLES.find((item) => item.href === table) ?? TABLES[0]
  const look = visitors ? PROFESSIONAL : todayLook()

  useEffect(() => {
    void fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { visitorMode?: boolean }) => setVisitors(Boolean(data.visitorMode)))
      .catch(() => undefined)
  }, [])

  async function setVisitorMode(next: boolean) {
    setPending(true)
    try {
      const response = await fetch("/api/office/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorMode: next }),
      })
      const data = (await response.json()) as { visitorMode?: boolean; reply?: string; error?: string }
      if (!response.ok) {
        setReply(data.error || "Visitor mode did not save.")
        return
      }
      setVisitors(Boolean(data.visitorMode))
      setReply(data.reply || (next ? "Professional outfit is on." : "Back to today’s look."))
    } finally {
      setPending(false)
    }
  }

  async function ask(message: string) {
    const content = message.trim()
    if (!content) return
    const appearance = visitorModeIntent(content)
    if (appearance !== null) {
      setPrompt("")
      await setVisitorMode(appearance)
      return
    }
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = (await response.json()) as {
        reply?: string
        href?: string
        draft?: { name: string; email?: string; company?: string }
        error?: string
      }
      if (!response.ok) {
        setReply(data.error || "I could not run that.")
        return
      }
      setReply(data.reply || "Done.")
      setDraft(data.draft ?? null)
      setPrompt("")
      if (data.href) router.push(data.href)
    } catch {
      setReply("I could not reach the office.")
    } finally {
      setPending(false)
    }
  }

  async function confirmDraft() {
    if (!draft) return
    setPending(true)
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_contact", confirmed: true, ...draft }),
      })
      const data = (await response.json()) as { error?: string }
      setReply(response.ok ? `Saved ${draft.name} in the CRM.` : data.error || "Nothing was saved.")
      if (response.ok) {
        setDraft(null)
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void ask(prompt || `Open ${current.label}`)
  }

  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-bg">
      <img src={look.src} alt="Ava Skye in Skye Studio" className="ava-drift absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-bg/10" />
      <div className="relative z-10 flex min-h-[78vh] flex-col justify-end gap-4 px-5 py-8">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Skye Studio</p>
        <h1 className="max-w-xl text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>
          Ava is at the desk.
        </h1>
        <p className="max-w-xl text-sm text-fg/90">
          Today’s look is {look.label}. Pick a work table. She opens it and waits for a yes before anything is saved.
        </p>
        <label className="grid max-w-sm gap-2 text-sm" htmlFor="work-table">
          Work table
          <select
            id="work-table"
            value={table}
            onChange={(event) => setTable(event.target.value as (typeof TABLES)[number]["href"])}
            className="rounded-full border border-border bg-bg/80 px-4 py-2"
          >
            {TABLES.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <form className="flex max-w-xl flex-wrap gap-2" onSubmit={onSubmit}>
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={`Ask Ava to run ${current.label}`}
            className="min-w-0 flex-1 rounded-full border border-border bg-bg/80 px-4 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending}>
            {pending ? "Working" : "Ask Ava"}
          </button>
          <button type="button" className="rounded-full border border-border bg-bg/70 px-4 py-2 text-sm" onClick={() => router.push(current.href)}>
            Open {current.label}
          </button>
          <button type="button" className="rounded-full border border-border bg-bg/70 px-4 py-2 text-sm" disabled={pending} onClick={() => void setVisitorMode(!visitors)}>
            {visitors ? "Back to today" : "Office visitors"}
          </button>
        </form>
        <p className="max-w-xl text-sm">{reply}</p>
        {draft ? (
          <div className="flex max-w-xl flex-wrap items-center gap-3 text-sm">
            <p>
              Draft contact: {draft.name}
              {draft.email ? ` · ${draft.email}` : ""}
              {draft.company ? ` · ${draft.company}` : ""}
            </p>
            <button type="button" className="rounded-full bg-accent px-3 py-1 text-accent-fg" disabled={pending} onClick={() => void confirmDraft()}>
              Confirm save
            </button>
            <button type="button" className="rounded-full border border-border px-3 py-1" onClick={() => setDraft(null)}>
              Discard
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
