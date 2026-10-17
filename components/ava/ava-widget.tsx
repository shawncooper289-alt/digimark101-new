"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import { AvaAvatar } from "@/components/branding/ava-avatar"
import { AVA_IDENTITY } from "@/lib/ava/identity"
import { spokenText } from "@/lib/ava/speech"
import { usePlatform } from "@/components/studio/platform-provider"
import { rosterFrom, type Action } from "@/lib/platform/types"

type Turn = { id: string; role: "user" | "assistant"; content: string }
type Anchor = { x: number; y: number }

const SUGGESTIONS = [
  "Which package fits a small team?",
  "Open the pipeline",
  "Add a contact named Jordan Lee",
  "Book an appointment tomorrow at 10am",
]

const AVATAR = 68

function speechInputSupported() {
  return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
}

function useSpeechInput() {
  return useSyncExternalStore(
    () => () => {},
    speechInputSupported,
    () => false,
  )
}

type RecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
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

function identityKey(email: string | null) {
  return email?.trim().toLowerCase() || "guest"
}

function positionKey(id: string) {
  return `digimark101.ava.position.${id}`
}

function voiceKey(id: string) {
  return `digimark101.ava.voice.${id}`
}

function clampAnchor(point: Anchor): Anchor {
  return {
    x: Math.min(window.innerWidth - AVATAR - 8, Math.max(8, point.x)),
    y: Math.min(window.innerHeight - AVATAR - 8, Math.max(8, point.y)),
  }
}

const prefListeners = new Set<() => void>()
const memoryAnchor = new Map<string, { x: number; y: number }>()
const memoryVoice = new Map<string, boolean>()
const anchorCache = new Map<string, { sig: string; value: Anchor | null }>()
const voiceCache = new Map<string, { raw: string; value: boolean }>()

function subscribePrefs(callback: () => void) {
  prefListeners.add(callback)
  window.addEventListener("resize", callback)
  return () => {
    prefListeners.delete(callback)
    window.removeEventListener("resize", callback)
  }
}

function emitPrefs() {
  prefListeners.forEach((callback) => callback())
}

function anchorSnapshot(id: string): Anchor | null {
  const width = window.innerWidth
  const height = window.innerHeight
  const mem = memoryAnchor.get(id)
  let raw = ""
  if (mem) raw = JSON.stringify(mem)
  else {
    try {
      raw = localStorage.getItem(positionKey(id)) || ""
    } catch {
      raw = ""
    }
  }
  const sig = `${width}x${height}:${raw}`
  const cached = anchorCache.get(id)
  if (cached?.sig === sig) return cached.value
  let value: Anchor | null = null
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        value = clampAnchor({ x: parsed.x * width, y: parsed.y * height })
      }
    } catch {
      value = null
    }
  }
  anchorCache.set(id, { sig, value })
  return value
}

function voiceSnapshot(id: string) {
  const mem = memoryVoice.get(id)
  let raw = mem === undefined ? "" : mem ? "1" : "0"
  if (mem === undefined) {
    try {
      raw = localStorage.getItem(voiceKey(id)) || ""
    } catch {
      raw = ""
    }
  }
  const cached = voiceCache.get(id)
  if (cached?.raw === raw) return cached.value
  const value = raw === "1"
  voiceCache.set(id, { raw, value })
  return value
}

function writeAnchor(id: string, point: Anchor) {
  const next = clampAnchor(point)
  const fraction = { x: next.x / window.innerWidth, y: next.y / window.innerHeight }
  memoryAnchor.set(id, fraction)
  anchorCache.delete(id)
  try {
    localStorage.setItem(positionKey(id), JSON.stringify(fraction))
  } catch {
    // Private browsing can block storage. The avatar still moves for this visit.
  }
  emitPrefs()
  return next
}

function writeVoice(id: string, next: boolean) {
  memoryVoice.set(id, next)
  voiceCache.delete(id)
  try {
    localStorage.setItem(voiceKey(id), next ? "1" : "0")
  } catch {
    // The toggle still works for this visit when storage is blocked.
  }
  emitPrefs()
}

function subscribeViewport(callback: () => void) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

let viewportSig = "0x0"
function viewportSnapshot() {
  const next = `${window.innerWidth}x${window.innerHeight}`
  if (next === viewportSig) return viewportSig
  viewportSig = next
  return viewportSig
}

export function AvaWidget() {
  const titleId = useId()
  const router = useRouter()
  const platform = usePlatform()
  const canListen = useSpeechInput()
  const identity = identityKey(platform.email)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [listening, setListening] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [live, setLive] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Turn[]>([])
  const [queued, setQueued] = useState<Action[] | null>(null)
  const [dragAnchor, setDragAnchor] = useState<{ id: string; point: Anchor } | null>(null)
  const readAnchor = useCallback(() => anchorSnapshot(identity), [identity])
  const readVoice = useCallback(() => voiceSnapshot(identity), [identity])
  const storedAnchor = useSyncExternalStore(subscribePrefs, readAnchor, () => null)
  const voice = useSyncExternalStore(subscribePrefs, readVoice, () => false)
  const viewportKey = useSyncExternalStore(subscribeViewport, viewportSnapshot, () => "0x0")
  const [viewportWidth, viewportHeight] = viewportKey.split("x").map((part) => Number(part))
  const anchor = dragAnchor?.id === identity ? dragAnchor.point : storedAnchor
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {})
  const voiceRef = useRef(false)
  const openRef = useRef(false)
  const pendingRef = useRef(false)
  const holdListen = useRef(false)
  const typingRef = useRef(false)
  const listeningRef = useRef(false)
  const silenceRef = useRef(0)
  const identityRef = useRef(identity)
  const anchorRef = useRef<Anchor | null>(null)
  const startListenRef = useRef<() => void>(() => {})
  const stopListenRef = useRef<() => void>(() => {})
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  function shouldListen() {
    return voiceRef.current && openRef.current && !pendingRef.current && !holdListen.current && !typingRef.current
  }

  function stopListen() {
    listeningRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }

  function startListen() {
    if (!shouldListen() || listeningRef.current) return
    const recognition = getRecognition()
    if (!recognition) {
      setNotice("This browser cannot use the microphone. Type your message instead.")
      return
    }
    let heard = false
    recognitionRef.current = recognition
    listeningRef.current = true
    recognition.onresult = (event) => {
      let transcript = ""
      let final = false
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? ""
        final = event.results[index]?.isFinal ?? final
      }
      setDraft(transcript)
      if (final && transcript.trim()) {
        heard = true
        silenceRef.current = 0
        void sendRef.current(transcript)
      }
    }
    recognition.onerror = (event) => {
      listeningRef.current = false
      setListening(false)
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        holdListen.current = true
        setNotice("Microphone is blocked. Type your message instead.")
      }
    }
    recognition.onend = () => {
      listeningRef.current = false
      recognitionRef.current = null
      setListening(false)
      if (heard || !shouldListen()) return
      if (silenceRef.current >= 1) {
        setNotice("Listening paused. Type a message, or press Listen.")
        return
      }
      silenceRef.current += 1
      window.setTimeout(() => startListen(), 280)
    }
    try {
      recognition.start()
      setListening(true)
    } catch {
      listeningRef.current = false
      setListening(false)
    }
  }

  function speak(text: string) {
    if (!voiceRef.current || !text || !("speechSynthesis" in window)) {
      holdListen.current = false
      if (shouldListen()) startListen()
      return
    }
    holdListen.current = true
    stopListen()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(spokenText(text))
    utterance.lang = AVA_IDENTITY.speech.browserLang
    utterance.rate = AVA_IDENTITY.speech.browserRate
    const resume = () => {
      holdListen.current = false
      if (shouldListen()) startListen()
    }
    utterance.onend = resume
    utterance.onerror = resume
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      openRef.current = true
      if (voiceRef.current) startListenRef.current()
    }
    window.addEventListener("ava:open", onOpen)
    return () => window.removeEventListener("ava:open", onOpen)
  }, [])

  useEffect(() => {
    identityRef.current = identity
    openRef.current = open
    pendingRef.current = pending
    voiceRef.current = voice
    sendRef.current = send
    startListenRef.current = startListen
    stopListenRef.current = stopListen
  })

  useEffect(() => {
    if (!open) {
      stopListenRef.current()
      window.speechSynthesis?.cancel()
      return
    }
    if (!voiceRef.current) inputRef.current?.focus()
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
    if (!content || pendingRef.current) return
    pendingRef.current = true
    holdListen.current = true
    stopListen()
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
      if (!response.ok || !data.text) throw new Error(data.error || "Ava could not answer.")
      if (data.fills) window.dispatchEvent(new CustomEvent("ava:fill", { detail: data.fills }))
      let reply = data.text
      if (data.clientActions?.length) {
        const detail = { actions: data.clientActions, summaries: [] as string[] }
        window.dispatchEvent(new CustomEvent("ava:client-actions", { detail }))
        if (detail.summaries.length) reply = detail.summaries.join(" ")
      }
      if (data.pendingActions?.length) setQueued(data.pendingActions)
      if (data.refresh) window.dispatchEvent(new Event("ava:refresh"))
      if (data.navigate && !data.pendingActions?.length) router.push(data.navigate)
      setLive(Boolean(data.live))
      setNotice(data.notice ?? null)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
      pendingRef.current = false
      setPending(false)
      speak(reply)
    } catch {
      pendingRef.current = false
      holdListen.current = false
      setPending(false)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I could not reach the studio assistant just now. Please try again, or email hello@digimark101.com.",
        },
      ])
    }
  }

  function setVoiceMode(next: boolean) {
    voiceRef.current = next
    writeVoice(identityRef.current, next)
    if (!next) {
      holdListen.current = false
      window.speechSynthesis?.cancel()
      stopListen()
      setNotice(null)
      return
    }
    silenceRef.current = 0
    holdListen.current = false
    setNotice(canListen ? "Voice is on. Ava will speak, then listen. You can still type." : "Voice can play replies here. This browser has no microphone, so type instead.")
    if (openRef.current) startListen()
  }

  function openChat() {
    setOpen(true)
    openRef.current = true
    if (voiceRef.current) {
      silenceRef.current = 0
      holdListen.current = false
      startListen()
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: rect.left,
      startY: rect.top,
      moved: false,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // The gesture still tracks pointer events when capture is unavailable.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.originX
    const dy = event.clientY - drag.originY
    if (!drag.moved && Math.hypot(dx, dy) < 6) return
    drag.moved = true
    const next = clampAnchor({ x: drag.startX + dx, y: drag.startY + dy })
    anchorRef.current = next
    setDragAnchor({ id: identityRef.current, point: next })
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (drag.moved && anchorRef.current) {
      writeAnchor(identityRef.current, anchorRef.current)
      setDragAnchor(null)
      return
    }
    openChat()
  }

  function onAvatarKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const delta = event.shiftKey ? 32 : 16
    const next = writeAnchor(identityRef.current, {
      x: rect.left + (event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0),
      y: rect.top + (event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0),
    })
    anchorRef.current = next
    setDragAnchor(null)
  }

  const panelStyle = (): React.CSSProperties | undefined => {
    if (viewportWidth < 640) return undefined
    const width = 400
    const height = Math.min(640, Math.max(360, viewportHeight - 24))
    const ax = anchor?.x ?? viewportWidth - AVATAR - 20
    const ay = anchor?.y ?? viewportHeight - AVATAR - 20
    const left = Math.min(viewportWidth - width - 12, Math.max(12, ax + AVATAR - width))
    const top = Math.min(viewportHeight - height - 12, Math.max(12, ay - height - 12))
    return { left, top, width, height }
  }

  return (
    <>
      {open ? null : (
        <button
          type="button"
          className={`ava-avatar-handle fixed z-50 h-[68px] w-[68px] overflow-hidden rounded-full border border-signal/50 bg-paper/30 shadow-[0_0_28px_rgba(203,176,130,0.28)] ${
            anchor ? "" : "bottom-5 right-5"
          }`}
          style={anchor ? { left: anchor.x, top: anchor.y } : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onAvatarKeyDown}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-label="Ava Skye. Drag to move her. Activate to open the chat."
        >
          <Image
            src="/media/ava-brand.jpg"
            alt=""
            width={240}
            height={320}
            className="h-full w-full object-cover object-[center_18%] opacity-75 transition hover:opacity-100"
          />
        </button>
      )}

      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(680px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-signal/25 bg-card shadow-[0_0_40px_rgba(203,176,130,0.16)] sm:inset-auto"
          style={viewportWidth >= 640 ? panelStyle() : undefined}
        >
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-pine px-4 py-3 text-ink">
            <div className="flex items-center gap-3">
              <AvaAvatar size="md" showOnlineIndicator isAnimated={pending || listening} />
              <div>
                <h2 id={titleId} className="font-serif text-xl leading-none">
                  Ava Skye
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  {listening ? "Listening" : live === null ? "Studio assistant" : live ? "Live model" : "Studio guide"}
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
                      className="rounded-2xl border border-ink/10 px-3 py-3 text-left text-sm hover:border-signal/40"
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
                          const reply = summaries.join(" ") || "Saved."
                          setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
                          window.dispatchEvent(new Event("ava:refresh"))
                          speak(reply)
                        } catch {
                          setMessages((current) => [
                            ...current,
                            { id: crypto.randomUUID(), role: "assistant", content: "I could not save that draft. Nothing was changed." },
                          ])
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
              onFocus={() => {
                typingRef.current = true
                stopListen()
              }}
              onBlur={(event) => {
                typingRef.current = false
                if (!event.currentTarget.value.trim() && shouldListen()) startListen()
              }}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send(draft)
                }
              }}
              placeholder="Type a message, or use voice"
              className="w-full resize-none rounded-2xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={voice}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                  voice ? "border-signal bg-signal text-[#14110c]" : "border-ink/20 text-ink"
                }`}
                onClick={() => setVoiceMode(!voice)}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${voice ? "bg-[#14110c]" : "bg-ink-soft"}`} aria-hidden="true" />
                Voice {voice ? "on" : "off"}
              </button>
              <button type="submit" className="btn btn-signal" disabled={pending || !draft.trim()}>
                Send
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (listening) {
                    stopListen()
                    return
                  }
                  silenceRef.current = 0
                  holdListen.current = false
                  if (!voiceRef.current) setVoiceMode(true)
                  else startListen()
                }}
                disabled={!canListen}
                aria-pressed={listening}
              >
                {listening ? "Stop listening" : "Listen"}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              {voice
                ? "Voice is a conversation: Ava speaks her replies and listens for yours. Typing still works."
                : "Voice is off. Type a message, or turn voice on for a spoken back-and-forth."}
            </p>
            {canListen ? null : (
              <p className="mt-2 text-xs text-ink-soft">
                The microphone needs a browser with the Web Speech API, such as Chrome or Edge. Typing works everywhere.
              </p>
            )}
          </form>
        </section>
      ) : null}
    </>
  )
}
