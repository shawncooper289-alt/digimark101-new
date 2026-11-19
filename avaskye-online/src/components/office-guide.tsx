"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { guideForPath, type GuideStep } from "@/lib/page-guide"

const STORAGE_KEY = "avaskye.ava.guided"

function stepKey(path: string) {
  return `avaskye.guide.step.${path}`
}

export function OfficeGuide({ menuOpen, onOpenMenu }: { menuOpen: boolean; onOpenMenu: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const titleId = useId()
  const guide = guideForPath(pathname)
  const steps: GuideStep[] = menuOpen
    ? guide.steps
    : [{ id: "open-studio", title: "Open the studio", detail: "Use Open the studio, or click the picture. Ava stays on this page either way, and guided mode can walk the desk after it opens." }, ...guide.steps]
  const [guided, setGuided] = useState(false)
  const [stored, setStored] = useState<boolean | null>(null)
  const [index, setIndex] = useState(0)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let local = false
    try {
      local = localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      local = false
    }
    setGuided(local)
    fetch("/api/office/appearance")
      .then((response) => response.json())
      .then((data: { guidedMode?: boolean | null }) => {
        if (typeof data.guidedMode === "boolean") {
          setGuided(data.guidedMode)
          try {
            localStorage.setItem(STORAGE_KEY, data.guidedMode ? "1" : "0")
          } catch {
            // The server value still applies for this visit.
          }
        }
      })
      .catch(() => {
        // The browser value stands when the desk cannot be read.
      })
  }, [])

  useEffect(() => {
    let saved = 0
    try {
      const raw = sessionStorage.getItem(stepKey(pathname))
      const next = raw ? Number(raw) : 0
      saved = Number.isFinite(next) ? next : 0
    } catch {
      saved = 0
    }
    setIndex(Math.min(Math.max(saved, 0), Math.max(steps.length - 1, 0)))
    setNote(null)
  }, [pathname, menuOpen, steps.length])

  function remember(next: number) {
    const clamped = Math.min(Math.max(next, 0), steps.length - 1)
    setIndex(clamped)
    try {
      sessionStorage.setItem(stepKey(pathname), String(clamped))
    } catch {
      // The step still changes for this visit.
    }
  }

  async function setMode(next: boolean) {
    setGuided(next)
    setNote(null)
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      // The toggle still changes for this visit.
    }
    try {
      const response = await fetch("/api/office/appearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guidedMode: next }),
      })
      const data = (await response.json()) as { stored?: boolean }
      setStored(response.ok && data.stored === true)
    } catch {
      setStored(false)
      setNote("Guided mode stayed on this browser.")
    }
  }

  const step = steps[Math.min(index, steps.length - 1)]
  const last = index >= steps.length - 1

  function goNext() {
    if (!menuOpen && step?.id === "open-studio") {
      try {
        sessionStorage.setItem(stepKey(pathname), "0")
      } catch {
        // The desk still opens.
      }
      onOpenMenu()
      return
    }
    if (!last) {
      remember(index + 1)
      return
    }
    if (guide.nextHref) {
      router.push(guide.nextHref)
      return
    }
    setNote("That's the last step on this page.")
  }

  function skip() {
    if (!last) {
      remember(index + 1)
      setNote("Skipped that step.")
      return
    }
    if (guide.nextHref) {
      setNote(`Skipped the rest of ${guide.label}.`)
      router.push(guide.nextHref)
      return
    }
    setNote("Skipped the last step.")
  }

  return (
    <section
      aria-labelledby={titleId}
      className="fixed bottom-36 left-3 z-40 w-[min(22rem,calc(100vw-6.5rem))] rounded-3xl border border-border bg-surface/95 p-4 text-sm shadow-2xl backdrop-blur"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-base">Ava on {guide.label}</h2>
        <button
          type="button"
          role="switch"
          aria-checked={guided}
          className={`rounded-full px-3 py-2 text-xs ${guided ? "bg-accent text-accent-fg" : "border border-border"}`}
          onClick={() => void setMode(!guided)}
        >
          Guided mode {guided ? "on" : "off"}
        </button>
      </div>
      {guided && step ? (
        <div className="mt-3">
          <p className="text-xs text-muted">
            Step {index + 1} of {steps.length}
            {guide.nextLabel ? ` · Next page: ${guide.nextLabel}` : ""}
          </p>
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-label="Guide progress"
          >
            <div className="h-full bg-accent" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="mt-3 font-medium">{step.title}</p>
          <p className="mt-1 text-muted">{step.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-border px-3 py-2" onClick={() => remember(index - 1)} disabled={index === 0}>
              Back
            </button>
            <button type="button" className="rounded-full border border-border px-3 py-2" onClick={skip}>
              Skip
            </button>
            <button type="button" className="rounded-full bg-accent px-3 py-2 text-accent-fg" onClick={goNext}>
              {last && guide.nextHref ? `Next page` : "Next"}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted">Ask Ava from the picture. Turn on guided mode when you want the steps for this page.</p>
      )}
      {stored === false ? <p className="mt-2 text-xs text-muted">Saved in this browser. The office database has not stored the toggle yet.</p> : null}
      {note ? <p className="mt-2 text-xs" role="status">{note}</p> : null}
    </section>
  )
}
