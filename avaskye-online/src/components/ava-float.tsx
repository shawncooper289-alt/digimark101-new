"use client"

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react"
import { AvaSpeak } from "@/components/ava-speak"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { prepareAvaSpeech, stopAvaSpeech } from "@/lib/ava-speech"
import { speakReply } from "@/lib/speak-reply"

const RELAXED = [
  { id: "satin", src: "/ava/float-satin.png", label: "Black satin" },
  { id: "emerald", src: "/ava/float-emerald.png", label: "Emerald silk" },
]
const PROFESSIONAL = { id: "professional", src: "/ava/float-professional.png", label: "Professional" }
const POSITION_KEY = "avaskye.ava.position"

type Point = { x: number; y: number }

function officeLook(visitor: boolean) {
  if (visitor) return PROFESSIONAL
  const day = Math.floor(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) / 86400000)
  return RELAXED[((day % RELAXED.length) + RELAXED.length) % RELAXED.length]
}

function clamp(point: Point, width: number, height: number): Point {
  const safeRight = Math.max(8, window.innerWidth - width - 8)
  const safeBottom = Math.max(8, window.innerHeight - height - Math.max(8, window.innerHeight * 0.02))
  return {
    x: Math.min(safeRight, Math.max(8, point.x)),
    y: Math.min(safeBottom, Math.max(8, point.y)),
  }
}

export function AvaFloat() {
  const [open, setOpen] = useState(false)
  const [visitor, setVisitor] = useState(false)
  const [text, setText] = useState("")
  const [reply, setReply] = useState(omitBannedLine("Hey. What should I call you?"))
  const [pending, setPending] = useState(false)
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [point, setPoint] = useState<Point | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const [textOnly, setTextOnly] = useState(false)
  const [deviceNote, setDeviceNote] = useState<string | null>(null)
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number; moved: boolean } | null>(null)
  const historyRef = useRef(history)
  const look = officeLook(visitor)

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { visitorMode?: boolean }) => setVisitor(Boolean(data.visitorMode)))
      .catch(() => setVisitor(false))
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(POSITION_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPoint({ x: parsed.x * window.innerWidth, y: parsed.y * window.innerHeight })
        }
      } catch {
        // She stays in the corner when storage is blocked.
      }
    })
  }, [])

  useEffect(() => {
    function onStart(event: Event) {
      prepareAvaSpeech()
      const detail = (event as CustomEvent<{ email?: string }>).detail
      const email = detail?.email
      if (!email) return
      setOpen(true)
      const starter = `set up my free account for ${email}`
      setText("")
      setPending(true)
      const starterTurn = { role: "user" as const, content: starter }
      fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: starter, history: historyRef.current }),
      })
        .then((response) => response.json())
        .then((data: { reply?: string; error?: string }) => {
          const next = omitBannedLine(data.reply || data.error || "What should I call you?")
          setReply(next)
          setHistory((prev) => [...prev, starterTurn, { role: "assistant" as const, content: next }].slice(-8))
          void speakReply(next, true, setDeviceNote)
        })
        .catch(() => setReply("I missed that. Try again?"))
        .finally(() => setPending(false))
    }
    window.addEventListener("ava:start-setup", onStart)
    return () => window.removeEventListener("ava:start-setup", onStart)
  }, [])

  function remember(next: Point, width: number, height: number) {
    const placed = clamp(next, width, height)
    setPoint(placed)
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ x: placed.x / window.innerWidth, y: placed.y / window.innerHeight }))
    } catch {
      // The move still holds for this visit.
    }
    return placed
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 && event.pointerType !== "touch") return
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
      // The drag still follows the pointer when capture is unavailable.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.originX
    const dy = event.clientY - drag.originY
    if (!drag.moved && Math.hypot(dx, dy) < 8) return
    drag.moved = true
    const rect = event.currentTarget.getBoundingClientRect()
    setPoint(clamp({ x: drag.startX + dx, y: drag.startY + dy }, rect.width, rect.height))
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (drag.moved) {
      const rect = event.currentTarget.getBoundingClientRect()
      remember({ x: rect.left, y: rect.top }, rect.width, rect.height)
      return
    }
    prepareAvaSpeech()
    setOpen(true)
    if (voiceOn && !textOnly) void speakReply(reply, true, setDeviceNote)
  }

  async function submit(content: string, aloud = false) {
    const message = content.trim()
    if (!message || pending) return
    prepareAvaSpeech()
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      const next = omitBannedLine(response.ok ? data.reply || "Okay." : data.error || "I didn't catch that.")
      setReply(next)
      setHistory((prev) => [...prev, { role: "user" as const, content: message }, { role: "assistant" as const, content: next }].slice(-8))
      if (response.ok) setText("")
      await speakReply(next, aloud || (voiceOn && !textOnly), setDeviceNote)
    } catch {
      const next = "I couldn't reach the desk. Try again in a second."
      setReply(next)
      await speakReply(next, aloud || (voiceOn && !textOnly), setDeviceNote)
    } finally {
      setPending(false)
    }
  }

  function send(event: FormEvent) {
    event.preventDefault()
    void submit(text)
  }

  function silence() {
    setVoiceOn(false)
    setTextOnly(true)
    stopAvaSpeech()
  }

  const placed = point ? { left: point.x, top: point.y } : undefined

  if (open) {
    return (
      <section
        className={`fixed z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-2xl safe-bottom ${point ? "" : "bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3"}`}
        style={point ? { left: Math.max(8, Math.min(point.x, window.innerWidth - 340)), top: Math.max(8, point.y - 220) } : undefined}
        aria-label="Ask Ava"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Ava Skye <span className="text-muted">· {look.label}</span></p>
          <div className="flex gap-1">
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs" onClick={silence}>Silence</button>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs" onClick={() => { setTextOnly(!textOnly); if (!textOnly) setVoiceOn(false); }}>{textOnly ? "Voice" : "Text only"}</button>
            <button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
        <p className="text-sm text-muted">{reply}</p>
        {deviceNote ? <p className="text-xs">{deviceNote}</p> : null}
        <AvaSpeak disabled={pending} onText={(utterance) => submit(utterance, true)} />
        <form className="flex gap-2" onSubmit={send}>
          <label className="sr-only" htmlFor="ava-float-help">Ask Ava</label>
          <input id="ava-float-help" value={text} onChange={(event) => setText(event.target.value)} placeholder="Answer or ask anything" className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 py-2.5 text-base" />
          <button type="submit" className="rounded-full bg-accent px-4 py-2.5 text-sm text-accent-fg" disabled={pending || !text.trim()}>{pending ? "…" : "Send"}</button>
        </form>
      </section>
    )
  }

  return (
    <button
      type="button"
      className={`fixed z-50 w-[4.1rem] cursor-grab touch-none border-0 bg-transparent p-0 active:cursor-grabbing sm:w-[4.9rem] md:w-[5.75rem] ${point ? "" : "bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-2"}`}
      style={placed}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label={`Ask Ava for help. Drag to move her. She is in ${look.label}.`}
    >
      <img src={look.src} alt="" draggable={false} className="pointer-events-none block h-auto w-full object-contain object-bottom drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)]" />
    </button>
  )
}
