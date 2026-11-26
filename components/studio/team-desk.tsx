"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { TeamDeskData } from "@/lib/ava/team/view"

export function TeamDesk({ initial }: { initial: TeamDeskData }) {
  const router = useRouter()
  const [goal, setGoal] = useState("")
  const [slug, setSlug] = useState(initial.cards[0]?.slug ?? "traffic")
  const [notice, setNotice] = useState(initial.message)
  const [busy, setBusy] = useState(false)
  const [museGoal, setMuseGoal] = useState("")
  const [briefText, setBriefText] = useState(initial.handoffs[0]?.briefText ?? "")
  const [handoffId, setHandoffId] = useState(initial.handoffs[0]?.id ?? "")
  const [paste, setPaste] = useState("")
  const [copied, setCopied] = useState(false)

  async function post(body: Record<string, unknown>) {
    setBusy(true)
    setNotice("")
    try {
      const response = await fetch("/api/studio/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await response.json() as { error?: string; text?: string; reason?: string; review?: string; briefText?: string; id?: string }
      if (!response.ok) {
        setNotice(data.error || "That did not save.")
        return data
      }
      setNotice(data.review || data.reason || data.text || "Saved.")
      router.refresh()
      return data
    } catch {
      setNotice("The desk could not be reached.")
      return null
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-[1.4rem] border border-ink/10 bg-card p-5" aria-labelledby="team-budget">
        <h2 id="team-budget" className="font-serif text-2xl">Model spend</h2>
        <p className="mt-2 text-sm text-ink-soft">{initial.meter.label}. This is the cap for model tokens, not ad spend.</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-deep" role="meter" aria-valuemin={0} aria-valuemax={initial.meter.capCents} aria-valuenow={initial.meter.spentCents} aria-label={initial.meter.label}>
          <div className="h-full bg-signal" style={{ width: `${Math.round(initial.meter.ratio * 100)}%` }} />
        </div>
        {notice ? <p className="mt-4 text-sm" role="status">{notice}</p> : null}
      </section>

      <section aria-labelledby="team-cards">
        <h2 id="team-cards" className="font-serif text-2xl">Agents</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {initial.cards.map((card) => (
            <article key={card.slug} className="rounded-[1.4rem] border border-ink/10 bg-card p-5">
              <h3 className="font-serif text-xl">{card.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{card.autonomy === "read_only" ? "Read only" : "Drafts only"} · {card.tools} tools · {card.paused ? "Paused" : "Ready"}</p>
              {card.pauseReason ? <p className="mt-2 text-sm">{card.pauseReason}</p> : null}
              {card.paused ? (
                <button type="button" className="btn btn-ghost mt-4" disabled={busy} onClick={() => void post({ action: "resume", slug: card.slug })}>Resume</button>
              ) : null}
            </article>
          ))}
        </div>
        <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void post({ action: "dispatch", slug, goal }) }}>
          <label className="grid gap-1 text-sm" htmlFor="team-agent">Agent
            <select id="team-agent" className="rounded-xl border border-ink/15 bg-paper px-3 py-2" value={slug} onChange={(event) => setSlug(event.target.value as typeof slug)}>
              {initial.cards.map((card) => <option key={card.slug} value={card.slug}>{card.title}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm" htmlFor="team-goal">Goal
            <textarea id="team-goal" className="min-h-24 rounded-xl border border-ink/15 bg-paper px-3 py-2" value={goal} onChange={(event) => setGoal(event.target.value)} required />
          </label>
          <button type="submit" className="btn btn-signal w-fit" disabled={busy || !initial.ready}>Run draft</button>
        </form>
      </section>

      <section aria-labelledby="team-board">
        <h2 id="team-board" className="font-serif text-2xl">Task board</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {initial.columns.map((column) => (
            <div key={column.status} className="rounded-[1.4rem] border border-ink/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">{column.status}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {column.runs.length ? column.runs.map((run) => <li key={run.id}>{run.slug}: {run.goal}</li>) : <li className="text-ink-soft">None</li>}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="team-inbox">
        <h2 id="team-inbox" className="font-serif text-2xl">Approvals</h2>
        <p className="mt-2 text-sm text-ink-soft">Publish, send, spend, and contact requests wait here. Approving uses the stored details.</p>
        <ul className="mt-4 space-y-3">
          {initial.approvals.length ? initial.approvals.map((item) => (
            <li key={item.id} className="rounded-[1.4rem] border border-ink/10 p-4">
              <p className="text-sm">{item.tool}{item.target ? ` · ${item.target}` : ""}</p>
              <p className="mt-1 text-sm text-ink-soft">Expires {item.expiresAt}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn btn-signal" disabled={busy} onClick={() => void post({ action: "approve", id: item.id })}>Approve</button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void post({ action: "reject", id: item.id })}>Reject</button>
              </div>
            </li>
          )) : <li className="text-sm text-ink-soft">Nothing is waiting.</li>}
        </ul>
      </section>

      <section aria-labelledby="muse-desk">
        <h2 id="muse-desk" className="font-serif text-2xl">Muse desk</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">Muse has no inbound API. Write the brief, copy it, paste it into Muse, then paste Muse&apos;s result back for review.</p>
        <form className="mt-4 grid gap-3" onSubmit={async (event) => {
          event.preventDefault()
          const saved = await post({ action: "muse_brief", goal: museGoal })
          if (saved?.briefText) {
            setBriefText(saved.briefText)
            setHandoffId(saved.id || "")
          }
        }}>
          <label className="grid gap-1 text-sm" htmlFor="muse-goal">Goal
            <textarea id="muse-goal" className="min-h-24 rounded-xl border border-ink/15 bg-paper px-3 py-2" value={museGoal} onChange={(event) => setMuseGoal(event.target.value)} required />
          </label>
          <button type="submit" className="btn btn-signal w-fit" disabled={busy || !initial.ready}>Write brief</button>
        </form>
        {briefText ? (
          <div className="mt-4">
            <label className="grid gap-1 text-sm" htmlFor="muse-copy">Brief to copy
              <textarea id="muse-copy" className="min-h-40 rounded-xl border border-ink/15 bg-paper px-3 py-2" readOnly value={briefText} />
            </label>
            <button type="button" className="btn btn-ghost mt-3" onClick={() => {
              void navigator.clipboard.writeText(briefText).then(() => setCopied(true)).catch(() => setNotice("Select the brief and copy it from there."))
            }}>{copied ? "Copied" : "Copy"}</button>
          </div>
        ) : null}
        <form className="mt-4 grid gap-3" onSubmit={(event) => { event.preventDefault(); void post({ action: "muse_result", id: handoffId, result: paste }) }}>
          <label className="grid gap-1 text-sm" htmlFor="muse-paste">Muse&apos;s result
            <textarea id="muse-paste" className="min-h-32 rounded-xl border border-ink/15 bg-paper px-3 py-2" value={paste} onChange={(event) => setPaste(event.target.value)} />
          </label>
          <button type="submit" className="btn btn-signal w-fit" disabled={busy || !handoffId}>Review paste</button>
        </form>
        <ul className="mt-4 space-y-3">
          {initial.handoffs.map((item) => (
            <li key={item.id}>
              <button type="button" className="text-left text-sm underline" onClick={() => { setHandoffId(item.id); setBriefText(item.briefText); setCopied(false) }}>
                {item.status}: {item.goal}
              </button>
              {item.avaReview ? <p className="mt-1 text-sm text-ink-soft">{item.avaReview}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
