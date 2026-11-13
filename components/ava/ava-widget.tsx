"use client"

import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import { AvaAvatar } from "@/components/branding/ava-avatar"
import { useDictate } from "@/components/ava/use-dictate"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { DEVICE_VOICE_NOTE, prepareAvaSpeech, speakAva, stopAvaSpeech } from "@/lib/ava/speech"
import { spokenCommand } from "@/lib/ava/voice-command"
import { applySetupSnapshot, readSetupDraft } from "@/lib/onboarding/setup-draft"
import { usePlatform } from "@/components/studio/platform-provider"
import { rosterFrom, type Action } from "@/lib/platform/types"

type Turn = { id: string; role: "user" | "assistant"; content: string }
type Anchor = { x: number; y: number }

const SUGGESTIONS = [
  "Set up my account",
  "Which package fits a small team?",
  "Open the pipeline",
  "Add a contact named Jordan Lee",
]

const AVATAR_W = 121
const AVATAR_H = 142

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (!part.startsWith("http")) return <span key={index}>{part}</span>
        const url = part.replace(/[),.;!?]+$/, "")
        const tail = part.slice(url.length)
        return (
          <span key={index}>
            <a href={url} className="underline break-all">
              {url}
            </a>
            {tail}
          </span>
        )
      })}
    </>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  )
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
    x: Math.min(window.innerWidth - AVATAR_W - 8, Math.max(8, point.x)),
    y: Math.min(window.innerHeight - AVATAR_H - 8, Math.max(8, point.y)),
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
  const value = raw !== "0"
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

export function AvaWidget() {
  const titleId = useId()
  const liveId = useId()
  const router = useRouter()
  const pathname = usePathname()
  const showBubble = pathname.startsWith("/studio")
  const platform = usePlatform()
  const identity = identityKey(platform.email)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [deviceNote, setDeviceNote] = useState<string | null>(null)
  const [live, setLive] = useState<boolean | null>(null)
  const [messages, setMessages] = useState<Turn[]>([])
  const [queued, setQueued] = useState<Action[] | null>(null)
  const [dragAnchor, setDragAnchor] = useState<{ id: string; point: Anchor } | null>(null)
  const readAnchor = useCallback(() => anchorSnapshot(identity), [identity])
  const readVoice = useCallback(() => voiceSnapshot(identity), [identity])
  const storedAnchor = useSyncExternalStore(subscribePrefs, readAnchor, () => null)
  const voice = useSyncExternalStore(subscribePrefs, readVoice, () => true)
  const [viewportKey, setViewportKey] = useState("0x0")
  useEffect(() => {
    const update = () => setViewportKey(`${window.innerWidth}x${window.innerHeight}`)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  const [viewportWidth, viewportHeight] = viewportKey.split("x").map((part) => Number(part))
  const anchor = dragAnchor?.id === identity ? dragAnchor.point : storedAnchor
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sendRef = useRef<(text: string, source?: "voice" | "typed") => Promise<void>>(async () => {})
  const speakRef = useRef<(text: string) => Promise<void>>(async () => {})
  const messagesRef = useRef<Turn[]>([])
  const voiceRef = useRef(false)
  const openRef = useRef(false)
  const pendingRef = useRef(false)
  const identityRef = useRef(identity)
  const anchorRef = useRef<Anchor | null>(null)
  const queuedRef = useRef<Action[] | null>(null)
  const dictate = useDictate(async (text) => {
    await sendRef.current(text, "voice")
  })
  const dictateRef = useRef(dictate)
  dictateRef.current = dictate
  queuedRef.current = queued
  const dragRef = useRef<{
    pointerId: number
    originX: number
    originY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  function speakAndWait(text: string, fromVoice: boolean) {
    if (!voiceRef.current || !text.trim()) return Promise.resolve()
    dictateRef.current.pause()
    prepareAvaSpeech()
    return new Promise<void>((resolve) => {
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        if (!fromVoice) dictateRef.current.resume()
        resolve()
      }
      void speakAva(text, finish).then((result) => {
        if (result.voice === "device") setDeviceNote(DEVICE_VOICE_NOTE)
        else if (result.status === "played") setDeviceNote(null)
        if (result.status !== "played") finish()
      })
    })
  }

  async function confirmQueued() {
    const actions = queuedRef.current
    if (!actions?.length) return
    prepareAvaSpeech()
    try {
      const summaries: string[] = []
      for (const action of actions) summaries.push(await platform.run(action))
      setQueued(null)
      const reply = omitBannedLine(summaries.join(" ") || "Saved.")
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
      window.dispatchEvent(new Event("ava:refresh"))
      await speakAndWait(reply, false)
    } catch {
      const reply = "I could not save that draft. Nothing was changed."
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
      await speakAndWait(reply, false)
    }
  }

  function discardQueued() {
    setQueued(null)
    const reply = "Discarded. Nothing was saved."
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
    void speakAndWait(reply, false)
  }

  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      openRef.current = true
    }
    const onAsk = (event: Event) => {
      const text = String((event as CustomEvent<string>).detail || "set up my account").trim()
      setOpen(true)
      openRef.current = true
      const history = messagesRef.current
      const started = history.some((item) => item.role === "user" && /set up my account|setup my account|just talk with ava/i.test(item.content))
      if (started && history.some((item) => item.role === "assistant")) {
        const last = [...history].reverse().find((item) => item.role === "assistant")
        if (last) void speakRef.current(last.content)
        return
      }
      if (text) void sendRef.current(text, "typed")
    }
    window.addEventListener("ava:open", onOpen)
    window.addEventListener("ava:ask", onAsk)
    return () => {
      window.removeEventListener("ava:open", onOpen)
      window.removeEventListener("ava:ask", onAsk)
    }
  }, [])

  useEffect(() => {
    identityRef.current = identity
    openRef.current = open
    pendingRef.current = pending
    voiceRef.current = voice
    messagesRef.current = messages
    sendRef.current = send
    speakRef.current = (text) => speakAndWait(text, false)
  })

  useEffect(() => {
    if (!open) {
      dictateRef.current.stop()
      stopAvaSpeech()
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, pending, open, dictate.live])

  useEffect(() => {
    return () => {
      stopAvaSpeech()
    }
  }, [])

  async function send(text: string, source: "voice" | "typed" = "typed") {
    const content = text.trim()
    if (!content || pendingRef.current) return
    const command = queuedRef.current?.length ? spokenCommand(content) : null
    if (command) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content }])
      setDraft("")
      if (command === "confirm") await confirmQueued()
      else discardQueued()
      return
    }
    prepareAvaSpeech()
    pendingRef.current = true
    dictateRef.current.pause()
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
          spoken: source === "voice",
          setupDraft: readSetupDraft(),
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
        setup?: unknown
      }
      if (!response.ok || !data.text) throw new Error(data.error || "Ava could not answer.")
      if (data.setup) applySetupSnapshot(data.setup)
      if (data.fills) window.dispatchEvent(new CustomEvent("ava:fill", { detail: data.fills }))
      let reply = omitBannedLine(data.text)
      if (data.clientActions?.length) {
        const detail = { actions: data.clientActions, summaries: [] as string[] }
        window.dispatchEvent(new CustomEvent("ava:client-actions", { detail }))
        if (detail.summaries.length) reply = omitBannedLine(detail.summaries.join(" "))
      }
      if (data.pendingActions?.length) setQueued(data.pendingActions)
      if (data.refresh) window.dispatchEvent(new Event("ava:refresh"))
      if (data.navigate && !data.pendingActions?.length) router.push(data.navigate)
      setLive(Boolean(data.live))
      setNotice(data.notice ?? null)
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
      pendingRef.current = false
      setPending(false)
      await speakAndWait(reply, source === "voice")
    } catch {
      pendingRef.current = false
      setPending(false)
      const reply = "I could not reach the studio assistant just now. Please try again, or email hello@digimark101.com."
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }])
      await speakAndWait(reply, source === "voice")
    }
  }

  function setVoiceMode(next: boolean) {
    voiceRef.current = next
    writeVoice(identityRef.current, next)
    if (!next) {
      dictateRef.current.stop()
      stopAvaSpeech()
      setNotice(null)
      return
    }
    prepareAvaSpeech()
    setNotice("Sound is on. Tap Speak and talk. You can still type.")
  }

  function openChat() {
    prepareAvaSpeech()
    setOpen(true)
    openRef.current = true
  }

  function onSpeak() {
    if (!voiceRef.current) setVoiceMode(true)
    prepareAvaSpeech()
    if (dictate.phase === "listening") {
      dictate.finish()
      return
    }
    void dictate.start()
  }

  function onHandsFree() {
    const next = !dictate.handsFree
    if (next && !voiceRef.current) setVoiceMode(true)
    prepareAvaSpeech()
    dictate.setHandsFree(next)
    if (next) {
      void dictate.start()
      return
    }
    if (dictate.phase === "listening") dictate.finish()
    else dictate.stop()
  }

  function onStop() {
    dictate.stop()
    stopAvaSpeech()
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
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault()
      openChat()
      return
    }
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
    const ax = anchor?.x ?? viewportWidth - AVATAR_W - 20
    const ay = anchor?.y ?? viewportHeight - AVATAR_H - 20
    const left = Math.min(viewportWidth - width - 12, Math.max(12, ax + AVATAR_W - width))
    const top = Math.min(viewportHeight - height - 12, Math.max(12, ay - height - 12))
    return { left, top, width, height }
  }

  const listening = dictate.phase === "listening"
  const liveLine =
    dictate.phase === "listening"
      ? dictate.live
        ? `Heard: ${dictate.live}`
        : "Listening…"
      : dictate.phase === "transcribing"
        ? "Turning speech into text…"
        : ""

  if (!open && !showBubble) return null

  return (
    <>
      {open || !showBubble ? null : (
        <button
          type="button"
          className={`ava-float fixed z-50 cursor-grab touch-none border-0 bg-transparent p-0 active:cursor-grabbing ${
            anchor ? "" : "right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          }`}
          style={anchor ? { left: anchor.x, top: anchor.y, width: AVATAR_W, height: AVATAR_H } : { width: AVATAR_W, height: AVATAR_H }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onAvatarKeyDown}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-label="Ask Ava for help. Drag to move her."
        >
          <Image
            src="/media/ava-float-full.png"
            alt=""
            draggable={false}
            width={712}
            height={836}
            className="pointer-events-none h-full w-full object-contain object-center drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)]"
          />
        </button>
      )}

      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(680px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-3xl border border-signal/25 bg-card shadow-[0_0_40px_rgba(203,176,130,0.16)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
          style={viewportWidth >= 640 ? panelStyle() : undefined}
        >
          <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-pine px-4 py-3 text-ink">
            <div className="flex items-center gap-3">
              <AvaAvatar size="md" showOnlineIndicator isAnimated={pending || dictate.phase !== "idle"} />
              <div>
                <h2 id={titleId} className="font-serif text-xl leading-none">
                  Ava Skye
                </h2>
                <p className="mt-1 text-xs text-ink-soft">
                  {listening ? "Listening" : dictate.phase === "transcribing" ? "Hearing you" : live === null ? "Studio assistant" : live ? "Connected" : notice ? "Not connected" : "Studio assistant"}
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
                  Tap Speak and talk, or type. Ask about a channel, a package, or how to brief the studio. I will not invent a client result.
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
                  <MessageText text={message.content} />
                </p>
              ))
            )}
            {pending ? <p className="text-sm text-ink-soft">Ava is thinking…</p> : null}
            {queued ? (
              <div className="rounded-2xl border border-ink/10 bg-mist p-3">
                <p className="text-sm text-ink">This stays a draft until you confirm it. You can say yes, or tap Confirm save.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="btn btn-signal" onClick={() => void confirmQueued()}>
                    Confirm save
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={discardQueued}>
                    Discard
                  </button>
                </div>
              </div>
            ) : null}
            {notice ? <p className="text-xs leading-relaxed text-signal">{notice}</p> : null}
            {deviceNote ? <p className="text-xs leading-relaxed text-signal">{deviceNote}</p> : null}
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
                dictateRef.current.pause()
              }}
              onBlur={(event) => {
                if (!event.currentTarget.value.trim() && dictate.handsFree) dictateRef.current.resume()
              }}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void send(draft)
                }
              }}
              placeholder="Type a message, or tap Speak"
              className="w-full resize-none rounded-2xl border border-ink/15 bg-mist px-3 py-2 text-sm text-ink outline-none"
            />
            <p id={liveId} className="mt-2 min-h-5 text-xs text-ink" role="status" aria-live="polite">
              {liveLine}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-signal"
                aria-pressed={listening}
                aria-label={listening ? "Done talking" : "Speak to Ava"}
                aria-describedby={liveId}
                disabled={pending || dictate.phase === "transcribing"}
                onClick={onSpeak}
              >
                <MicIcon />
                {listening ? "Done" : dictate.phase === "transcribing" ? "Hearing…" : "Speak"}
              </button>
              <button
                type="button"
                className={`btn ${dictate.handsFree ? "btn-signal" : "btn-ghost"}`}
                aria-pressed={dictate.handsFree}
                aria-label={dictate.handsFree ? "Turn hands-free off" : "Start hands-free conversation"}
                onClick={onHandsFree}
              >
                {dictate.handsFree ? "Hands-free on" : "Hands-free"}
              </button>
              {listening || dictate.handsFree || dictate.phase === "transcribing" ? (
                <button type="button" className="btn btn-ink" aria-label="Stop Ava and stop the microphone" onClick={onStop}>
                  Stop
                </button>
              ) : null}
              <button
                type="button"
                role="switch"
                aria-checked={voice}
                aria-label={voice ? "Turn Ava's voice off" : "Turn Ava's voice on"}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                  voice ? "border-signal bg-signal text-[#14110c]" : "border-ink/20 text-ink"
                }`}
                onClick={() => setVoiceMode(!voice)}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${voice ? "bg-[#14110c]" : "bg-ink-soft"}`} aria-hidden="true" />
                Sound {voice ? "on" : "off"}
              </button>
              <button type="submit" className="btn btn-ghost" disabled={pending || !draft.trim()}>
                Send
              </button>
            </div>
            {dictate.note ? <p className="mt-2 text-xs leading-relaxed text-signal">{dictate.note}</p> : null}
            <p className="mt-2 text-xs text-ink-soft">
              Tap Speak and talk. You do not have to type. Hands-free lets Ava answer, then listen again, until you tap Stop.
            </p>
          </form>
        </section>
      ) : null}
    </>
  )
}
