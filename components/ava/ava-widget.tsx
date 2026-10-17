"use client"

import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import { AvaAvatar } from "@/components/branding/ava-avatar"
import { usePlatform } from "@/components/studio/platform-provider"
import { rosterFrom, type Action } from "@/lib/platform/types"

type Turn = { id: string; role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Which package fits a small team?",
  "Open the pipeline",
  "Add a contact named Jordan Lee",
  "Book an appointment tomorrow at 10am",
]

function speechSupported() {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
}

function useSpeechSupport() {
  return useSyncExternalStore(
    () => () => {},
    speechSupported,
    () => false,
  )
}

type RecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognition(): RecognitionLike | null {
  const browser = window as Window & {
    SpeechRecognition?: new () => RecognitionLike
    webkitSpeechRecognition?: new () => RecognitionLike
  }
  const Ctor = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = "en-US"
  recognition.interimResults = true
  recognition.continuous = false
  return recognition
}

function visibleFields() {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-ava-field]"))
    .map((node) => node.getAttribute("data-ava-field"))
    .filter((value): value is string => Boolean(value))
}

export function AvaWidget() {
  const titleId = useId()
  const router = useRouter()
  const platform = usePlatform()
  const canSpeak = useSpeechSupport()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [listening, setListening] = useState(false)
  const [voice, setVoice] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [live, setLive] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Turn[]>([])
  const [queued, setQueued] = useState<Action[] | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<RecognitionLike | null>(null)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener("ava:open", onOpen)
    return () => window.removeEventListener("ava:open", onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, pending, open])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
    }
  }, [])

  async function send(text: string) {
    const content = text.trim()
    if (!content || pending) return
    const nextMessages = [...messages, { id: crypto.randomUUID(), role: "user" as const, content }]
    setMessages(nextMessages)
    setDraft("")
    setPending(true)
    setNotice(null)
    try {
      const response = await fetch("/api/ava/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: value }) => ({ role, content: value })),
          pageFields: visibleFields(),
          roster: platform.mode === "preview" ? rosterFrom(platform.workspace) : null,
        }),
      })
      const data = (await response.json()) as {
        text?: string
        live?: boolean
        notice?: string
        error?: string
        fills?: Record<string, string> | null
        navigate?: string | null
        clientActions?: Action[] | null
        pendingActions?: Action[] | null
        refresh?: boolean
      }
      if (!response.ok || !data.text) {
        throw new Error(data.error || "Ava could not answer.")
      }
      if (data.fills) window.dispatchEvent(new CustomEvent("ava:fill", { detail: data.fills }))
      let text = data.text
      if (data.clientActions?.length) {
        const detail = { actions: data.clientActions, summaries: [] as string[] }
        window.dispatchEvent(new CustomEvent("ava:client-actions", { detail }))
        if (detail.summaries.length) text = detail.summaries.join(" ")
      }
      if (data.pendingActions?.length) setQueued(data.pendingActions)
      if (data.refresh) window.dispatchEvent(new Event("ava:refresh"))
      if (data.navigate && !data.pendingActions?.length) router.push(data.navigate)
      setLive(Boolean(data.live))
      setNotice(data.notice ?? null)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: text }])
      if (voice && text && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1
        window.speechSynthesis.speak(utterance)
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I could not reach the studio assistant just now. Please try again, or email hello@digimark101.com.",
        },
      ])
    } finally {
      setPending(false)
    }
  }

  function toggleListening() {
    if (!canSpeak) return
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = getRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    recognition.onresult = (event) => {
      let transcript = ""
      let final = false
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? ""
        final = event.results[index]?.isFinal ?? final
      }
      setDraft(transcript)
      if (final && transcript.trim()) {
        void send(transcript)
      }
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  return (
    <>
      {open ? null : (
        <button
          type="button"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-ink/15 bg-card py-2 pl-2 pr-4 text-ink shadow-xl"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={false}
        >
          <AvaAvatar size="md" showOnlineIndicator />
          <span className="text-left">
            <span className="block text-sm font-semibold">Ava Skye</span>
            <span className="block text-xs text-ink-soft">Ask the studio</span>
          </span>
        </button>
      )}

      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(680px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-card shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-pine px-4 py-3 text-ink">
            <div className="flex items-center gap-3">
              <AvaAvatar size="md" showOnlineIndicator isAnimated={pending} />
              <div>
                <h2 id={titleId} className="font-serif text-xl leading-none">
                  Ava Skye
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  {live === null ? "Studio assistant" : live ? "Live model" : "Studio guide"}
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-signal min-h-10 px-3" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 ? (
              <div>
                <p className="text-sm leading-relaxed text-ink-soft">
                  Ask about a channel, a package, or how to brief the studio. I will not invent a client result.
                </p>
                <div className="mt-4 grid gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="rounded-2xl border border-ink/10 px-3 py-3 text-left text-sm hover:border-ink/30"
                      onClick={() => void send(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <p
                  key={message.id}
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user" ? "ml-auto bg-mist text-ink" : "bg-paper-deep text-ink"
                  }`}
                >
                  {message.content}
                </p>
              ))
            )}
            {pending ? <p className="text-sm text-ink-soft">Ava is thinking…</p> : null}
            {queued ? (
              <div className="rounded-2xl border border-ink/10 bg-mist p-3">
                <p className="text-sm text-ink">This stays a draft until you confirm it.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-signal"
                    onClick={() => {
                      void (async () => {
                        try {
                          const summaries: string[] = []
                          for (const action of queued) summaries.push(await platform.run(action))
                          setQueued(null)
                          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: summaries.join(" ") || "Saved." }])
                          window.dispatchEvent(new Event("ava:refresh"))
                        } catch {
                          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: "I could not save that draft. Nothing was changed." }])
                        }
                      })()
                    }}
                  >
                    Confirm save
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setQueued(null)}>
                    Discard
                  </button>
                </div>
              </div>
            ) : null}
            {notice ? <p className="text-xs leading-relaxed text-signal">{notice}</p> : null}
          </div>

          <form
            className="border-t border-ink/10 p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void send(draft)
            }}
          >
            <label htmlFor="ava-draft" className="sr-only">
              Message Ava
            </label>
            <textarea
              id="ava-draft"
              ref={inputRef}
              value={draft}
              rows={2}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send(draft)
                }
              }}
              placeholder="Ask about the work…"
              className="w-full resize-none rounded-2xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-ink/15 p-1" role="group" aria-label="Reply mode">
                <button type="button" className={`rounded-full px-3 py-2 text-xs font-semibold ${voice ? "" : "bg-ink text-paper"}`} aria-pressed={!voice} onClick={() => setVoice(false)}>
                  Type
                </button>
                <button type="button" className={`rounded-full px-3 py-2 text-xs font-semibold ${voice ? "bg-ink text-paper" : ""}`} aria-pressed={voice} onClick={() => setVoice(true)}>
                  Voice
                </button>
              </div>
              <button type="submit" className="btn btn-signal" disabled={pending || !draft.trim()}>
                Send
              </button>
              <button type="button" className="btn btn-ghost" onClick={toggleListening} disabled={!canSpeak} aria-pressed={listening}>
                {listening ? "Stop" : "Talk"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">{voice ? "Voice reads replies aloud. Talk or type." : "Type a message, or press Talk to dictate."}</p>
            {canSpeak ? null : (
              <p className="mt-2 text-xs text-ink-soft">Voice input needs a browser with the Web Speech API, such as Chrome or Edge. Typing works everywhere.</p>
            )}
          </form>
        </section>
      ) : null}
    </>
  )
}
