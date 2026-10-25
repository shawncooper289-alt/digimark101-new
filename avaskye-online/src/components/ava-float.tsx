"use client"

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react"
import { speakAva } from "@/lib/ava-speech"

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
  return {
    x: Math.min(window.innerWidth - width - 8, Math.max(8, point.x)),
    y: Math.min(window.innerHeight - height - 8, Math.max(8, point.y)),
  }
}

export function AvaFloat() {
  const [open, setOpen] = useState(false)
  const [visitor, setVisitor] = useState(false)
  const [text, setText] = useState("")
  const [reply, setReply] = useState("Hey. What should I call you?")
  const [pending, setPending] = useState(false)
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [point, setPoint] = useState<Point | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const [textOnly, setTextOnly] = useState(false)
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number; moved: boolean } | null>(null)
  const historyRef = useRef(history)
  historyRef.current = history
  const look = officeLook(visitor)

  useEffect(() => {
    fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { visitorMode?: boolean }) => setVisitor(Boolean(data.visitorMode)))
      .catch(() => setVisitor(false))
  }, [])

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (!open || !voiceOn || textOnly || !reply) {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel()
      return
    }
    speakAva(reply)
  }, [reply, voiceOn, textOnly, open])

  useEffect(() => {
    function onStart(event: Event) {
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
          const next = data.reply || data.error || "What should I call you?"
          setReply(next)
          setHistory((prev) => [...prev, starterTurn, { role: "assistant", content: next }].slice(-8))
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
      // The drag still follows the pointer when capture is unavailable.
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.originX
    const dy = event.clientY - drag.originY
    if (!drag.moved && Math.hypot(dx, dy) < 6) return
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
    setOpen(true)
  }

  async function send(event: FormEvent) {
    event.preventDefault()
    const content = text.trim()
    if (!content || pending) return
    setPending(true)
    try {
      const response = await fetch("/api/office/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      const next = response.ok ? data.reply || "Okay." : data.error || "I didn't catch that."
      setReply(next)
      setHistory((prev) => [...prev, { role: "user", content }, { role: "assistant", content: next }].slice(-8))
      if (response.ok) setText("")
    } catch {
      setReply("I couldn't reach the desk. Try again in a second.")
    } finally {
      setPending(false)
    }
  }

  function silence() {
    setVoiceOn(false)
    setTextOnly(true)
    if (typeof window !== "undefined") window.speechSynthesis?.cancel()
  }

  const placed = point ? { left: point.x, top: point.y } : undefined

  if (open) {
    return (
      <section
        className={`fixed z-50 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-3 rounded-3xl border border-border bg-surface p-4 shadow-2xl ${point ? "" : "bottom-3 right-3"}`}
        style={point ? { left: Math.max(8, Math.min(point.x, window.innerWidth - 340)), top: Math.max(8, point.y - 200) } : undefined}
        aria-label="Ask Ava"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Ava Skye <span className="text-muted">· {look.label}</span></p>
          <div className="flex gap-1">
            <button type="button" className="rounded-full border border-border px-2 py-1 text-xs" onClick={silence}>Silence</button>
            <button type="button" className="rounded-full border border-border px-2 py-1 text-xs" onClick={() => { setTextOnly(!textOnly); if (!textOnly) setVoiceOn(false); }}>{textOnly ? "Voice" : "Text only"}</button>
            <button type="button" className="rounded-full border border-border px-2 py-1 text-xs" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
        <p className="text-sm text-muted">{reply}</p>
        <form className="flex gap-2" onSubmit={send}>
          <label className="sr-only" htmlFor="ava-float-help">Ask Ava</label>
          <input id="ava-float-help" value={text} onChange={(event) => setText(event.target.value)} placeholder="Answer or ask anything" className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-accent px-3 py-2 text-sm text-accent-fg" disabled={pending || !text.trim()}>{pending ? "…" : "Send"}</button>
        </form>
      </section>
    )
  }

  return (
    <button
      type="button"
      className={`fixed z-50 w-24 cursor-grab touch-none border-0 bg-transparent p-0 active:cursor-grabbing sm:w-28 ${point ? "" : "bottom-2 right-2"}`}
      style={placed}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      aria-label={`Ask Ava for help. Drag to move her. She is in ${look.label}.`}
    >
      <img src={look.src} alt="" draggable={false} className="pointer-events-none h-auto w-full drop-shadow-[0_16px_24px_rgba(0,0,0,0.55)]" />
    </button>
  )
}
