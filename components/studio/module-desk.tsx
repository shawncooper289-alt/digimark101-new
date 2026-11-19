"use client"

import { useCallback, useEffect, useState } from "react"
import { forgetDesk, rememberDesk } from "@/components/ava/page-beacon"
import { usePlatform } from "@/components/studio/platform-provider"
import { DESKS, fieldDefaults, type DeskId } from "@/lib/modules/desk"
import type { PageContext } from "@/lib/ava/tools/page"

type Row = { id: string; title: string; meta: string; stage?: string }
type Pending = { name: string; args: Record<string, string>; summary: string }

export function ModuleDesk({ module, embedded = false }: { module: DeskId; embedded?: boolean }) {
  const desk = DESKS[module]
  const platform = usePlatform()
  const workspace = platform.workspaceId ? `&workspace=${encodeURIComponent(platform.workspaceId)}` : ""
  const [rows, setRows] = useState<Row[]>([])
  const [values, setValues] = useState<Record<string, string>>(() => fieldDefaults(desk))
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState<Pending | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/studio/modules?module=${desk.id}${workspace}`)
      const body = (await response.json()) as { summary?: string; rows?: Row[]; ok?: boolean }
      setRows(body.rows ?? [])
      if (!response.ok && body.summary) setError(body.summary)
    } catch {
      setError("Could not load this module.")
    } finally {
      setLoading(false)
    }
  }, [desk.id, workspace])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const response = await fetch(`/api/studio/modules?module=${desk.id}${workspace}`)
      const body = (await response.json()) as { summary?: string; rows?: Row[] }
      if (cancelled) return
      setRows(body.rows ?? [])
      if (!response.ok && body.summary) setError(body.summary)
      setLoading(false)
    })()
    const onRefresh = () => {
      if (!cancelled) void load()
    }
    window.addEventListener("ava:refresh", onRefresh)
    return () => {
      cancelled = true
      window.removeEventListener("ava:refresh", onRefresh)
    }
  }, [desk.id, load, workspace])

  useEffect(() => {
    const page: PageContext = {
      path: desk.page,
      module: desk.id,
      title: desk.title,
      visible: rows.slice(0, 12).map((row) => ({ type: desk.id, id: row.id, label: row.meta ? `${row.title} (${row.meta})` : row.title })),
    }
    rememberDesk(page)
    return () => forgetDesk(desk.page)
  }, [desk, rows])

  async function submit(tool: string, args: Record<string, string>, confirmed = false) {
    setError("")
    setNotice("")
    const page: PageContext = { path: desk.page, module: desk.id, title: desk.title, visible: [] }
    const response = await fetch("/api/ava/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tool, args: { ...args, workspaceId: platform.workspaceId ?? "" }, confirmed, page }),
    })
    const body = (await response.json()) as { summary?: string; pending?: Pending; rows?: Row[] }
    if (body.pending) {
      setPending({ ...body.pending, args })
      setNotice(body.pending.summary)
      return
    }
    setPending(null)
    if (!response.ok) {
      setError(body.summary || "Could not save that.")
      return
    }
    setNotice(body.summary || "Saved.")
    setValues(fieldDefaults(desk))
    await load()
  }

  return (
    <section className={embedded ? "border-t border-ink/10 pt-8" : ""}>
      {embedded ? null : <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>}
      <h2 className={embedded ? "font-serif text-3xl" : "display mt-2 text-4xl md:text-5xl"}>{desk.title}</h2>
      <p className="mt-3 max-w-2xl text-ink-soft">{desk.lede}</p>
      {notice ? <p className="mt-4 text-sm font-medium text-pine">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-signal">{error}</p> : null}
      {pending ? (
        <div className="mt-4 max-w-xl rounded-3xl border border-ink/10 bg-mist p-4">
          <p className="text-sm">{pending.summary}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="btn btn-signal" onClick={() => void submit(pending.name, pending.args, true)}>
              Confirm
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {desk.fields.length ? (
        <form
          className="mt-6 grid max-w-xl gap-3 rounded-3xl border border-ink/10 bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault()
            const action = desk.actions.find((item) => !item.confirm) ?? desk.actions[0]
            if (!action) return
            void submit(action.tool, { ...fieldDefaults(desk), ...values }, false)
          }}
        >
          {desk.fields.map((field) => (
            <label key={field.name} className="grid gap-1 text-sm">
              <span className="font-medium">{field.label}</span>
              {field.kind === "textarea" ? (
                <textarea data-ava-field={field.name} value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="min-h-24 rounded-2xl border border-ink/15 px-3 py-2" />
              ) : field.kind === "select" ? (
                <select data-ava-field={field.name} value={values[field.name] ?? field.options?.[0] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="min-h-11 rounded-2xl border border-ink/15 px-3">
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  data-ava-field={field.name}
                  type={field.kind === "datetime" ? "datetime-local" : field.kind === "number" ? "number" : "text"}
                  min={field.kind === "number" ? "0" : undefined}
                  step={field.name === "amount" ? "0.01" : undefined}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="min-h-11 rounded-2xl border border-ink/15 px-3"
                />
              )}
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            {desk.actions.map((action) => (
              <button
                key={action.tool}
                type="button"
                className={action.confirm ? "btn btn-ghost" : "btn btn-signal"}
                onClick={() => void submit(action.tool, { ...fieldDefaults(desk), ...values }, false)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </form>
      ) : null}
      {loading ? <p className="mt-6 text-sm text-ink-soft">Loading this workspace…</p> : null}
      {!loading && rows.length === 0 ? <p className="mt-6 text-sm text-ink-soft">Nothing here yet.</p> : null}
      <ul className="mt-4 grid gap-2">
        {rows.map((row) => (
          <li key={`${row.id}-${row.title}`} className="rounded-2xl border border-ink/10 bg-card px-4 py-3">
            <p className="font-medium">{row.title}</p>
            {row.meta ? <p className="text-sm text-ink-soft">{row.meta}</p> : null}
            {row.id ? <p className="mt-1 font-mono text-xs text-ink-soft">{row.id}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3">
              {desk.fields.some((field) => field.name === "id" || field.name === "formId") ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-signal"
                  onClick={() => {
                    const key = desk.fields.some((field) => field.name === "formId") ? "formId" : "id"
                    setValues((current) => ({ ...fieldDefaults(desk), ...current, [key]: row.id }))
                    setNotice(`Using ${row.title}. The id is filled in below.`)
                  }}
                >
                  Use this
                </button>
              ) : null}
              {module === "pipeline" && row.stage && row.stage !== "won" && row.stage !== "lost" ? (
                <>
                  <button type="button" className="text-xs font-semibold text-signal" onClick={() => void submit("deals.move", { id: row.id, stage: row.stage === "new" ? "qualified" : row.stage === "qualified" ? "proposal" : "won" }, false)}>
                    Move forward
                  </button>
                  <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("deals.move", { id: row.id, stage: "lost" }, false)}>
                    Mark lost
                  </button>
                </>
              ) : null}
              {module === "calendar" && row.id ? (
                <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("bookings.cancel", { id: row.id }, false)}>
                  Cancel booking
                </button>
              ) : null}
              {module === "invoices" && row.id ? (
                <>
                  <button type="button" className="text-xs font-semibold text-signal" onClick={() => void submit("invoices.mark_paid", { id: row.id }, false)}>
                    Mark paid
                  </button>
                  <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("invoices.void", { id: row.id }, false)}>
                    Void
                  </button>
                  <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("invoices.request_payment", { id: row.id }, false)}>
                    Request payment
                  </button>
                </>
              ) : null}
              {module === "workflows" && row.id ? (
                <button type="button" className="text-xs font-semibold text-signal" onClick={() => void submit("workflows.run", { id: row.id }, false)}>
                  Run
                </button>
              ) : null}
              {module === "campaigns" && row.id ? (
                <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("campaigns.send", { id: row.id }, false)}>
                  Queue send
                </button>
              ) : null}
              {module === "social" && row.id ? (
                <button type="button" className="text-xs font-semibold text-ink-soft" onClick={() => void submit("social.publish", { id: row.id }, false)}>
                  Mark scheduled
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
