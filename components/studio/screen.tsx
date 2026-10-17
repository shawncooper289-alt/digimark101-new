"use client"

import { useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { usePlatform } from "@/components/studio/platform-provider"
import type { Action, Stage } from "@/lib/platform/types"

export type StudioSection =
  | "today"
  | "contacts"
  | "pipeline"
  | "calendar"
  | "inbox"
  | "campaigns"
  | "sites"
  | "automations"
  | "reports"
  | "files"
  | "memory"

const copy: Record<StudioSection, { title: string; lede: string }> = {
  today: { title: "Today", lede: "One workspace. Ask Ava to add a contact, book a time, or open a section." },
  contacts: { title: "Contacts", lede: "People in this client workspace only." },
  pipeline: { title: "Pipeline", lede: "Deals move from new to won. Nothing here is a reported result." },
  calendar: { title: "Calendar", lede: "Appointments you or Ava book in this workspace." },
  inbox: { title: "Inbox", lede: "Notes and automation logs. External email and SMS are not connected yet." },
  campaigns: { title: "Email", lede: "Campaign drafts, including email. Creating one does not send it." },
  sites: { title: "Funnels", lede: "A record of a site or funnel. The visual builder is a later phase, so nothing here is published." },
  automations: { title: "Automations", lede: "A small set of triggers that run inside this workspace." },
  reports: { title: "Reports", lede: "Counts of your own rows. These are not benchmarks and not client results." },
  files: { title: "Files", lede: "Files are stored in your Supabase folder. Other clients cannot read them." },
  memory: { title: "Memory", lede: "Facts Ava keeps for this client. They are not shared with any other login." },
}

export function StudioScreen({ section }: { section: StudioSection }) {
  const platform = usePlatform()
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const workspace = platform.workspace

  async function submit(action: Action) {
    setError("")
    try {
      setNotice(await platform.run(action))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that.")
    }
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">{copy[section].title}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">{copy[section].lede}</p>
      {notice ? <p className="mt-4 text-sm font-medium text-pine">{notice}</p> : null}
      {error ? <p className="mt-4 text-sm text-signal">{error}</p> : null}
      <div className="mt-8">
        {section === "today" ? <Today /> : null}
        {section === "contacts" ? <Contacts onSubmit={submit} rows={workspace.contacts} /> : null}
        {section === "pipeline" ? <Pipeline onSubmit={submit} rows={workspace.deals} /> : null}
        {section === "calendar" ? <Calendar onSubmit={submit} rows={workspace.appointments} /> : null}
        {section === "inbox" ? <Inbox onSubmit={submit} rows={workspace.threads} /> : null}
        {section === "campaigns" ? <Campaigns onSubmit={submit} rows={workspace.campaigns} /> : null}
        {section === "sites" ? <Sites onSubmit={submit} rows={workspace.sites} /> : null}
        {section === "automations" ? <Automations onSubmit={submit} rows={workspace.automations} /> : null}
        {section === "reports" ? <Reports /> : null}
        {section === "files" ? <Files /> : null}
        {section === "memory" ? <Memory onSubmit={submit} rows={workspace.memory} /> : null}
      </div>
    </section>
  )
}

function Today() {
  const { workspace } = usePlatform()
  const cards = [
    ["Contacts", workspace.contacts.length],
    ["Deals", workspace.deals.length],
    ["Appointments", workspace.appointments.length],
    ["Campaigns", workspace.campaigns.length],
    ["Automations", workspace.automations.length],
    ["Memories", workspace.memory.length],
  ]
  return (
    <div>
      <dl className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-ink/10 bg-card p-4">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="font-serif text-4xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-ink-soft">Counts are this workspace only.</p>
    </div>
  )
}

function Contacts({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; name: string; email: string; company: string }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm
        fields={["name", "email", "phone", "company"]}
        onSubmit={(values) => onSubmit({ type: "create_contact", name: values.name, email: values.email, phone: values.phone, company: values.company })}
      />
      <List empty="No contacts yet." rows={rows.map((row) => ({ id: row.id, title: row.name, meta: [row.company, row.email].filter(Boolean).join(" · ") }))} />
    </div>
  )
}

function Pipeline({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; title: string; stage: string; contactName: string }[] }) {
  const columns: Stage[] = ["new", "qualified", "proposal", "won", "lost"]
  return (
    <div>
      <RecordForm fields={["title", "contactName"]} onSubmit={(values) => onSubmit({ type: "create_deal", title: values.title, contactName: values.contactName })} />
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {columns.map((stage) => (
          <div key={stage} className="rounded-3xl border border-ink/10 bg-card p-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">{stage}</h2>
            <ul className="mt-3 grid gap-2">
              {rows.filter((row) => row.stage === stage).map((row) => (
                <li key={row.id} className="rounded-2xl bg-paper px-3 py-2 text-sm">
                  <p className="font-medium">{row.title}</p>
                  <p className="text-ink-soft">{row.contactName}</p>
                  {stage !== "won" && stage !== "lost" ? (
                    <button type="button" className="mt-2 text-xs font-semibold text-signal" onClick={() => void onSubmit({ type: "move_deal", title: row.title, stage: stage === "new" ? "qualified" : stage === "qualified" ? "proposal" : "won" })}>
                      Move forward
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function Calendar({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; title: string; contactName: string; startsAt: string }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm
        fields={["title", "contactName", "startsAt"]}
        onSubmit={(values) => onSubmit({ type: "book_appointment", title: values.title || "Appointment", contactName: values.contactName, startsAt: new Date(values.startsAt).toISOString() })}
      />
      <List empty="Nothing booked." rows={rows.map((row) => ({ id: row.id, title: row.title, meta: `${row.contactName} · ${new Date(row.startsAt).toLocaleString()}` }))} />
    </div>
  )
}

function Inbox({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; contactName: string; subject: string; messages: { body: string }[] }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm fields={["contactName", "subject", "body"]} onSubmit={(values) => onSubmit({ type: "log_message", contactName: values.contactName || "Workspace", subject: values.subject, body: values.body })} />
      <List empty="The inbox is empty." rows={rows.map((row) => ({ id: row.id, title: row.subject, meta: `${row.contactName} · ${row.messages.at(-1)?.body ?? ""}` }))} />
    </div>
  )
}

function Campaigns({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; name: string; channel: string; status: string }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm fields={["name", "channel", "brief"]} onSubmit={(values) => onSubmit({ type: "start_campaign", name: values.name, channel: values.channel || "email", brief: values.brief })} />
      <List empty="No campaigns." rows={rows.map((row) => ({ id: row.id, title: row.name, meta: `${row.channel} · ${row.status}` }))} />
    </div>
  )
}

function Sites({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; name: string; status: string; headline: string }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm fields={["name", "headline"]} onSubmit={(values) => onSubmit({ type: "create_site", name: values.name, headline: values.headline })} />
      <List empty="No sites registered." rows={rows.map((row) => ({ id: row.id, title: row.name, meta: `${row.status}${row.headline ? ` · ${row.headline}` : ""}` }))} />
    </div>
  )
}

function Automations({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { id: string; name: string; trigger: string; action: string; enabled: boolean }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm
        fields={["name", "trigger", "action"]}
        onSubmit={(values) =>
          onSubmit({
            type: "create_automation",
            name: values.name || "Studio automation",
            trigger: values.trigger === "appointment.booked" || values.trigger === "deal.moved" ? values.trigger : "contact.created",
            action: values.action === "remember" ? "remember" : "log_inbox",
          })
        }
      />
      <List empty="No automations." rows={rows.map((row) => ({ id: row.id, title: row.name, meta: `${row.trigger} → ${row.action}` }))} />
    </div>
  )
}

function Reports() {
  const { workspace } = usePlatform()
  const won = workspace.deals.filter((deal) => deal.stage === "won").length
  return (
    <dl className="grid max-w-xl gap-3">
      {[
        ["Contacts", workspace.contacts.length],
        ["Open deals", workspace.deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost").length],
        ["Deals marked won", won],
        ["Upcoming appointments", workspace.appointments.length],
        ["Draft campaigns", workspace.campaigns.length],
        ["Draft sites", workspace.sites.length],
      ].map(([label, value]) => (
        <div key={String(label)} className="flex items-center justify-between border-t border-ink/10 py-3">
          <dt>{label}</dt>
          <dd className="font-serif text-2xl">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Files() {
  const platform = usePlatform()
  const [message, setMessage] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (platform.workspaceId) data.set("workspaceId", platform.workspaceId)
    const response = await fetch("/api/studio/files", { method: "POST", body: data })
    const body = (await response.json()) as { error?: string }
    setMessage(response.ok ? "File stored in your private folder." : body.error || "Could not store that file.")
    if (response.ok) {
      event.currentTarget.reset()
      await platform.refresh()
    }
  }

  return (
    <div>
      {platform.mode === "account" ? (
        <form onSubmit={onSubmit} className="grid max-w-md gap-3 rounded-3xl border border-ink/10 bg-card p-4">
          <label className="text-sm font-medium" htmlFor="client-file">
            Upload
          </label>
          <input id="client-file" name="file" type="file" required className="text-sm" />
          <button className="btn btn-signal" type="submit">
            Store file
          </button>
        </form>
      ) : (
        <p className="rounded-3xl border border-ink/10 bg-card p-4 text-sm text-ink-soft">Sign in to upload. Preview mode does not keep file bytes.</p>
      )}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
      <ul className="mt-4 grid gap-2">
        {platform.workspace.files.map((file) => (
          <li key={file.id} className="rounded-2xl border border-ink/10 px-3 py-2 text-sm">
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Memory({ onSubmit, rows }: { onSubmit: (action: Action) => Promise<void>; rows: { key: string; value: string }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <RecordForm fields={["key", "value"]} onSubmit={(values) => onSubmit({ type: "remember", key: values.key, value: values.value })} />
      <List empty="No memories yet." rows={rows.map((row) => ({ id: row.key, title: row.key, meta: row.value }))} />
    </div>
  )
}

function RecordForm({ fields, onSubmit }: { fields: string[]; onSubmit: (values: Record<string, string>) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({})
  useAvaForm((fills) => setValues((current) => ({ ...current, ...Object.fromEntries(Object.entries(fills).filter(([key]) => fields.includes(key))) })))

  return (
    <form
      className="grid gap-3 rounded-3xl border border-ink/10 bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSubmit(values).then(() => setValues({}))
      }}
    >
      {fields.map((field) => (
        <label key={field} className="grid gap-1 text-sm">
          <span className="font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
          {field === "body" || field === "brief" || field === "value" ? (
            <textarea data-ava-field={field} value={values[field] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} className="min-h-24 rounded-2xl border border-ink/15 px-3 py-2" />
          ) : field === "trigger" ? (
            <select data-ava-field={field} value={values[field] ?? "contact.created"} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} className="min-h-11 rounded-2xl border border-ink/15 px-3">
              <option value="contact.created">When a contact is created</option>
              <option value="appointment.booked">When an appointment is booked</option>
              <option value="deal.moved">When a deal moves</option>
            </select>
          ) : field === "action" ? (
            <select data-ava-field={field} value={values[field] ?? "log_inbox"} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} className="min-h-11 rounded-2xl border border-ink/15 px-3">
              <option value="log_inbox">Log an inbox note</option>
              <option value="remember">Save a memory</option>
            </select>
          ) : (
            <input
              data-ava-field={field}
              type={field === "startsAt" ? "datetime-local" : field === "email" ? "email" : "text"}
              value={values[field] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              className="min-h-11 rounded-2xl border border-ink/15 px-3"
            />
          )}
        </label>
      ))}
      <button type="submit" className="btn btn-signal">
        Save
      </button>
    </form>
  )
}

function List({ rows, empty }: { rows: { id: string; title: string; meta: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-soft">{empty}</p>
  return (
    <ul className="grid gap-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded-2xl border border-ink/10 bg-card px-4 py-3">
          <p className="font-medium">{row.title}</p>
          {row.meta ? <p className="text-sm text-ink-soft">{row.meta}</p> : null}
        </li>
      ))}
    </ul>
  )
}
