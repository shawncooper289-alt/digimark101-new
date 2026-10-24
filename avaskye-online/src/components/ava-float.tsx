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
  const [reply, setReply] = useState("Shawn, I'm Ava — your partner. You own DigiMark101 and this office. I work for your success, the business, and our clients. Drag me or click when you want help. Voice is on; tap silence anytime.")
  const [pending, setPending] = useState(false)
  const [point, setPoint] = useState<Point | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const [textOnly, setTextOnly] = useState(false)
  const dragRef = useRef<{ pointerId: number; originX: number; originY: number; startX: number; startY: number; moved: boolean } | null>(null)
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
    if (voiceOn && !textOnly && reply) {
      speakAva(reply)
    }
  }, [reply, voiceOn, textOnly])

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
        body: JSON.stringify({ message: content }),
      })
      const data = (await response.json()) as { reply?: string; error?: string }
      const next = response.ok ? data.reply || "Done." : data.error || "I could not answer that."
      setReply(next)
      if (response.ok) setText("")
    } catch {
      setReply("I could not reach the office guide.")
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
          <input id="ava-float-help" value={text} onChange={(event) => setText(event.target.value)} placeholder="What do you need, partner?" className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="rounded-full bg-accent px-3 py-2 text-sm text-accent-fg" disabled={pending || !text.trim()}>{pending ? "…" : "Ask"}</button>
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
