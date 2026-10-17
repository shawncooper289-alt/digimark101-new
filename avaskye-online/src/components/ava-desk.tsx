"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { spokenText } from "@/lib/ava-speech"

export function AvaDesk() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [reply, setReply] = useState("Ask me to open a desk, summarize the counts, or draft a contact. I will not save anything until you confirm.")
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<{ name: string; email?: string; company?: string } | null>(null)
  const [voice, setVoice] = useState(false)

  function speak(line: string) {
    if (!voice || typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spokenText(line))
    utterance.lang = "en-US"
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      })
      const data = (await response.json()) as { reply?: string; href?: string; draft?: { name: string; email?: string; company?: string }; error?: string }
      if (!response.ok) {
        setReply(data.error || "I could not answer that.")
        return
      }
      const nextReply = data.reply || "Done."
      setReply(nextReply)
      speak(nextReply)
      setDraft(data.draft ?? null)
      setText("")
      if (data.href) router.push(data.href)
    } catch {
      setReply("I could not reach the office guide.")
    } finally {
      setPending(false)
    }
  }

  async function confirm() {
    if (!draft) return
    setPending(true)
    try {
      const response = await fetch("/api/office/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_contact", confirmed: true, ...draft }),
      })
      const data = (await response.json()) as { error?: string }
      const saved = response.ok ? `Saved ${draft.name} in the CRM.` : data.error || "Nothing was saved."
      setReply(saved)
      if (response.ok) speak(saved)
      if (response.ok) {
        setDraft(null)
        router.refresh()
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="border-t border-border bg-surface px-5 py-4">
      <form className="mx-auto flex max-w-6xl flex-wrap items-end gap-3" onSubmit={send}>
        <label className="min-w-0 flex-1 text-sm" htmlFor="ava-desk">
          Ava Skye
          <input id="ava-desk" value={text} onChange={(event) => setText(event.target.value)} placeholder="Open leads, or draft a contact named Jordan Lee" className="mt-1 w-full rounded-full border border-border bg-transparent px-4 py-2" />
        </label>
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !text.trim()}>
          Ask
        </button>
        <button
          type="button"
          className="rounded-full border border-border px-4 py-2 text-sm"
          aria-pressed={voice}
          onClick={() => {
            const next = !voice
            setVoice(next)
            if (!next) window.speechSynthesis?.cancel()
          }}
        >
          Voice {voice ? "on" : "off"}
        </button>
      </form>
      <p className="mx-auto mt-3 max-w-6xl text-sm text-muted">{reply}</p>
      {draft ? (
        <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-3 text-sm">
          <p>Draft contact: {draft.name}{draft.email ? ` · ${draft.email}` : ""}{draft.company ? ` · ${draft.company}` : ""}</p>
          <button type="button" className="rounded-full bg-accent px-3 py-1 text-accent-fg" onClick={() => void confirm()} disabled={pending}>Confirm save</button>
          <button type="button" className="rounded-full border border-border px-3 py-1" onClick={() => setDraft(null)}>Discard</button>
        </div>
      ) : null}
    </section>
  )
}
