"use client"

import { useEffect, useId, useRef, useState } from "react"

const DISMISS_KEY = "avaskye.public.ava.dismissed"

type Turn = { role: "user" | "assistant"; content: string }

export function PublicAva() {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const [dismissed, setDismissed] = useState(false)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState<Turn[]>([])

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1")
    } catch {
      setDismissed(false)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (open) {
      inputRef.current?.focus()
      wasOpen.current = true
      return
    }
    if (wasOpen.current) {
      launcherRef.current?.focus()
      wasOpen.current = false
    }
  }, [open, ready])

  function remember(next: boolean) {
    setDismissed(next)
    try {
      localStorage.setItem(DISMISS_KEY, next ? "1" : "0")
    } catch {
      // The choice still holds for this visit.
    }
  }

  async function send(content: string) {
    const message = content.trim()
    if (!message || pending) return
    setPending(true)
    setText("")
    setMessages((current) => [...current, { role: "user", content: message }])
    try {
      const response = await fetch("/api/ava/public-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.slice(-8),
        }),
      })
      const data = (await response.json()) as { text?: string; error?: string }
      const reply = data.text || data.error || "I could not answer that."
      setMessages((current) => [...current, { role: "assistant", content: reply }])
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "I could not reach Ava. Try the contact page on digimark101.com." }])
    } finally {
      setPending(false)
    }
  }

  if (!ready) return null

  if (!open && dismissed) {
    return (
      <button
        ref={launcherRef}
        type="button"
        className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 rounded-full border border-border bg-surface px-3 py-2 text-sm shadow-lg"
        onClick={() => remember(false)}
      >
        Show Ava
      </button>
    )
  }

  if (!open) {
    return (
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex items-end gap-2">
        <button type="button" className="rounded-full border border-border bg-surface px-3 py-2 text-xs shadow-lg" onClick={() => remember(true)}>
          Dismiss
        </button>
        <button
          ref={launcherRef}
          type="button"
          className="rounded-full border border-border bg-surface px-4 py-3 text-sm shadow-lg"
          aria-haspopup="dialog"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          Ask Ava
        </button>
      </div>
    )
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-sm">Ava Skye</h2>
        <button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto text-sm" aria-live="polite">
        {messages.length === 0 ? <p className="text-muted">Ask about pricing, Studio, or creating an account. I won't open the owner desk from here.</p> : null}
        {messages.map((item, index) => (
          <p key={`${item.role}-${index}`} className={item.role === "user" ? "text-right" : "text-muted"}>
            {item.content}
          </p>
        ))}
        {pending ? <p className="text-muted">Ava is thinking…</p> : null}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void send(text)
        }}
      >
        <input
          id="public-ava-draft"
          ref={inputRef}
          aria-label="Message Ava"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 py-2 text-sm"
          placeholder="Ask a question"
        />
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" disabled={pending || !text.trim()}>
          Send
        </button>
      </form>
    </section>
  )
}
