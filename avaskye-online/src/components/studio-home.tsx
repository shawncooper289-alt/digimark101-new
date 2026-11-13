"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import { AvaSpeak } from "@/components/ava-speak"
import { visitorModeIntent } from "@/lib/appearance-command"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenCommand } from "@/lib/ava/voice-command"
import { prepareAvaSpeech, stopAvaSpeech } from "@/lib/ava-speech"
import { speakReply } from "@/lib/speak-reply"
import { AvaLiveCharacter } from "@/components/ava-live-character"

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

export function StudioHome({ counts, keyRejected = false }: { counts: { label: string; value: number | null }[]; keyRejected?: boolean }) {
  const router = useRouter()
  const [visitors, setVisitors] = useState(false)
  const [standing, setStanding] = useState(false)
  const [table, setTable] = useState<(typeof TABLES)[number]["href"]>(TABLES[0].href)
  const [prompt, setPrompt] = useState("")
  const [reply, setReply] = useState(omitBannedLine("Tell me which table to run. I open it. I do not publish or save until you say yes."))
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<{ name: string; email?: string; company?: string } | null>(null)
  const [voice, setVoice] = useState(true)
  const [deviceNote, setDeviceNote] = useState<string | null>(null)
  const current = TABLES.find((item) => item.href === table) ?? TABLES[0]

  useEffect(() => {
    void fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { visitorMode?: boolean }) => setVisitors(Boolean(data.visitorMode)))
      .catch(() => undefined)
  }, [])

  function speak(line: string, aloud = voice) {
    return speakReply(omitBannedLine(line), aloud, setDeviceNote)
  }

  async function setVisitorMode(next: boolean) {
    prepareAvaSpeech()
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
      const nextReply = omitBannedLine(data.reply || (next ? "Professional outfit is on." : "Back to today’s look."))
      setReply(nextReply)
      await speak(nextReply)
    } finally {
      setPending(false)
    }
  }

  async function ask(message: string, aloud = false) {
    const content = message.trim()
    if (!content || pending) return
    const command = draft ? spokenCommand(content) : null
    if (command === "confirm") {
      await confirmDraft()
      return
    }
    if (command === "discard") {
      setDraft(null)
      const next = "Discarded. Nothing was saved."
      setReply(next)
      await speak(next, aloud || voice)
      return
    }
    prepareAvaSpeech()
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
      const nextReply = omitBannedLine(data.reply || "Done.")
      setReply(nextReply)
      await speak(nextReply, aloud || voice)
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
    prepareAvaSpeech()
    setPending(true)
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_contact", confirmed: true, ...draft }),
      })
      const data = (await response.json()) as { error?: string }
      const saved = omitBannedLine(response.ok ? `Saved ${draft.name} in the CRM.` : data.error || "Nothing was saved.")
      setReply(saved)
      if (response.ok) await speak(saved)
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
    <section className="relative min-h-[calc(100dvh-4.5rem)] overflow-hidden bg-bg sm:min-h-[calc(100dvh-7.5rem)]">
      <AvaLiveCharacter
        standing={visitors || standing}
        className="ava-drift absolute inset-0 h-full w-full object-cover object-center opacity-95 sm:object-[center_25%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/40 to-transparent" />
      <div className="relative z-10 flex min-h-[calc(100dvh-4.5rem)] flex-col justify-end gap-3 px-3 py-4 safe-bottom sm:min-h-[calc(100dvh-7.5rem)] sm:gap-4 sm:px-8 sm:py-6">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Ava&apos;s Skye Studio · night city</p>
          <p className="mt-1 max-w-xl text-sm text-fg/90 sm:mt-2">
            {visitors ? "Visitor mode. Professional suit, same office." : "Dark city office. She is live on the floor."}
          </p>
        </div>
        <div className="grid max-w-5xl gap-3 rounded-3xl border border-white/15 bg-bg/70 p-3 backdrop-blur-sm sm:gap-4 sm:p-4">
          {keyRejected ? (
            <p className="rounded-2xl border border-border bg-bg/60 px-3 py-2 text-sm text-fg/90">
              The office database key was not accepted, so these counts use your sign-in. On the avaskye.online project in Vercel, set SUPABASE_SECRET_KEY to the secret key for Supabase project sdjbvdujcmfmdjfolmhv. A key from a different project will keep failing.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {counts.map((item) => (
              <p key={item.label} className="rounded-2xl border border-border bg-bg/40 px-2 py-1.5 sm:px-3 sm:py-2">
                <span className="block text-[9px] uppercase tracking-[0.14em] text-muted sm:text-[10px]">{item.label}</span>
                <span className="mt-0.5 block text-xl sm:mt-1 sm:text-2xl">{item.value === null ? "—" : item.value}</span>
              </p>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Work tables">
            {TABLES.map((item) => (
              <button
                key={item.href}
                type="button"
                aria-pressed={item.href === table}
                onClick={() => setTable(item.href)}
                className={`rounded-full px-2.5 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm ${item.href === table ? "bg-accent text-accent-fg" : "border border-border bg-bg/50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" onSubmit={onSubmit}>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={`Ask Ava to run ${current.label}`}
              className="min-w-0 w-full flex-1 rounded-full border border-border bg-bg/70 px-4 py-2.5 text-base sm:w-auto sm:py-2 sm:text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded-full bg-accent px-4 py-2.5 text-sm text-accent-fg" disabled={pending}>
                {pending ? "Working" : "Ask Ava"}
              </button>
              <AvaSpeak disabled={pending} onText={(utterance) => ask(utterance, true)} />
              <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2.5 text-sm" onClick={() => router.push(current.href)}>
                Open {current.label}
              </button>
              <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2.5 text-sm" disabled={pending || visitors} onClick={() => setStanding((value) => !value)}>
                {standing ? "Sit her down" : "Have her stand"}
              </button>
              <button type="button" className="rounded-full border border-border bg-bg/60 px-4 py-2.5 text-sm" disabled={pending} onClick={() => void setVisitorMode(!visitors)}>
                {visitors ? "Back to tonight" : "Office visitors"}
              </button>
              <button
                type="button"
                className="rounded-full border border-border bg-bg/60 px-4 py-2.5 text-sm"
                aria-pressed={voice}
                aria-label={voice ? "Turn Ava's voice off" : "Turn Ava's voice on"}
                onClick={() => {
                  const next = !voice
                  setVoice(next)
                  if (!next) stopAvaSpeech()
                }}
              >
                Sound {voice ? "on" : "off"}
              </button>
            </div>
          </form>
          <p className="max-w-3xl text-sm">{reply}</p>
          {deviceNote ? <p className="max-w-3xl text-xs text-muted">{deviceNote}</p> : null}
          {draft ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p>
                Draft contact: {draft.name}
                {draft.email ? ` · ${draft.email}` : ""}
                {draft.company ? ` · ${draft.company}` : ""}
              </p>
              <button type="button" className="rounded-full bg-accent px-3 py-1.5 text-accent-fg" disabled={pending} onClick={() => void confirmDraft()}>
                Confirm save
              </button>
              <button type="button" className="rounded-full border border-border px-3 py-1.5" onClick={() => setDraft(null)}>
                Discard
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
