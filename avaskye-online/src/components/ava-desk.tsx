"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { AvaSpeak } from "@/components/ava-speak"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenCommand } from "@/lib/ava/voice-command"
import { prepareAvaSpeech, stopAvaSpeech } from "@/lib/ava-speech"
import { speakReply } from "@/lib/speak-reply"

export function AvaDesk() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [reply, setReply] = useState(omitBannedLine("What should we work on?"))
  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState<{ name: string; email?: string; company?: string } | null>(null)
  const [voice, setVoice] = useState(false)
  const [deviceNote, setDeviceNote] = useState<string | null>(null)

  function say(line: string, aloud = voice) {
    return speakReply(omitBannedLine(line), aloud, setDeviceNote)
  }

  async function submit(content: string, aloud = false) {
    const message = content.trim()
    if (!message || pending) return
    const command = draft ? spokenCommand(message) : null
    if (command === "confirm") {
      await confirm()
      return
    }
    if (command === "discard") {
      setDraft(null)
      const next = "Discarded. Nothing was saved."
      setReply(next)
      await say(next, aloud || voice)
      return
    }
    prepareAvaSpeech()
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      const data = (await response.json()) as { reply?: string; href?: string; draft?: { name: string; email?: string; company?: string }; error?: string }
      if (!response.ok) {
        const next = data.error || "I could not answer that."
        setReply(next)
        await say(next, aloud || voice)
        return
      }
      const nextReply = omitBannedLine(data.reply || "Done.")
      setReply(nextReply)
      setDraft(data.draft ?? null)
      setText("")
      if (data.href) router.push(data.href)
      await say(nextReply, aloud || voice)
    } catch {
      const next = "I could not reach the office guide."
      setReply(next)
      await say(next, aloud || voice)
    } finally {
      setPending(false)
    }
  }

  function send(event: FormEvent) {
    event.preventDefault()
    void submit(text)
  }

  async function confirm() {
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
      if (response.ok) await say(saved, voice)
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
        <AvaSpeak disabled={pending} onText={(utterance) => submit(utterance, true)} />
        <button
          type="button"
          className="rounded-full border border-border px-4 py-2 text-sm"
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
      </form>
      <p className="mx-auto mt-3 max-w-6xl text-sm text-muted">{reply}</p>
      {deviceNote ? <p className="mx-auto mt-2 max-w-6xl text-xs text-muted">{deviceNote}</p> : null}
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
