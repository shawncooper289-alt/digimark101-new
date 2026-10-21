"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { visitorModeIntent } from "@/lib/appearance-command"

const SITTING = { id: "sitting", label: "At the desk", src: "/ava/desk-sitting.jpg" }
const PROFESSIONAL = { id: "professional", label: "Professional", src: "/ava/desk-standing.jpg" }
const PORTRAIT = { id: "portrait", src: "/ava/professional.jpg" }

const TABLES = [
  { href: "/products", label: "Hub" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
  { href: "/crm", label: "CRM" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/automations", label: "Automations" },
  { href: "/billing", label: "Billing" },
  { href: "/records", label: "Records" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
  { href: "/tools", label: "Tools" },
  { href: "/settings", label: "Settings" },
] as const

export function StudioHome({ counts }: { counts: { label: string; value: number | null }[] }) {
  const router = useRouter()
  const [visitors, setVisitors] = useState(false)
  const [standing, setStanding] = useState(false)
  const [table, setTable] = useState<(typeof TABLES)[number]["href"]>(TABLES[0].href)
  const [prompt, setPrompt] = useState("")
  const [reply, setReply] = useState("Tell me which table to run. I open it. I do not publish or save until you say yes.")
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<{ name: string; email?: string; company?: string } | null>(null)
  const current = TABLES.find((item) => item.href === table) ?? TABLES[0]
  const look = visitors || standing ? PROFESSIONAL : SITTING
  const pose = look.id === "professional" ? "standing" : "sitting"

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
    <section className="relative min-h-[calc(100dvh-7.5rem)] overflow-hidden bg-bg">
      <img src={look.src} alt={`Ava Skye ${pose} at the desk in Skye Studio`} className="ava-drift absolute inset-0 h-full w-full object-cover object-[center_25%] opacity-95" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/30 to-transparent" />
      <div className="pointer-events-none absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
        <img src={PORTRAIT.src} alt="Ava Skye" className="h-[28rem] w-auto rounded-3xl object-cover object-top shadow-2xl ring-1 ring-white/20" />
      </div>
      <div className="relative z-10 flex min-h-[calc(100dvh-7.5rem)] flex-col justify-end gap-4 px-4 py-6 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Skye Studio · night city</p>
          <h1 className="mt-2 max-w-xl text-5xl text-fg" style={{ fontFamily: "var(--font-display-loaded), serif" }}>
            Ava is {pose} at the desk.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fg/90">
            {visitors ? "Visitor mode. Professional suit, same office." : "Dark city office. The glass desk below is the live work table."}
          </p>
        </div>
        <div className="grid max-w-5xl gap-4 rounded-3xl border border-white/15 bg-bg/65 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {counts.map((item) => (
              <p key={item.label} className="rounded-2xl border border-border bg-bg/40 px-3 py-2">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-muted">{item.label}</span>
                <span className="mt-1 block text-2xl">{item.value === null ? "—" : item.value}</span>
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Work tables">
            {TABLES.map((item) => (
              <button
                key={item.href}
                type="button"
                role="listitem"
                aria-pressed={item.href === table}
                onClick={() => setTable(item.href)}
                className={`rounded-full px-3 py-1 text-sm ${item.href === table ? "bg-accent text-accent-fg" : "border border-border bg-bg/50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <form className="flex flex-wrap gap-2" onSubmit={onSubmit}>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={`Ask Ava to run ${current.label}`}
              className="min-w-0 flex-1 rounded-full border border-border bg-bg/70 px-4 py-2 text-sm"
            />
            <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending}>
              {pending ? "Working" : "Ask Ava"}
            </button>
            <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2 text-sm" onClick={() => router.push(current.href)}>
              Open {current.label}
            </button>
            <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2 text-sm" disabled={pending || visitors} onClick={() => setStanding((value) => !value)}>
              {standing ? "Sit her down" : "Have her stand"}
            </button>
            <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2 text-sm" disabled={pending} onClick={() => void setVisitorMode(!visitors)}>
              {visitors ? "Back to tonight" : "Office visitors"}
            </button>
          </form>
          <p className="max-w-3xl text-sm">{reply}</p>
          {draft ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
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
      </div>
    </section>
  )
}
