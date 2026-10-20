import { requireOwner, deskRowsMaybe, text } from "@/lib/desk"
import { BriefingButton } from "@/components/briefing-button"
export default async function BriefingsPage() {
  const owner = await requireOwner()
  if (!owner) return null
  const rows = await deskRowsMaybe("client_memory", `select=memory_key,memory_value,updated_at&owner_id=eq.${owner.id}&memory_key=like.ava.daily-briefing.*&order=memory_key.desc&limit=30`)
  return <section><h1 className="text-5xl">Daily planning briefings</h1>
    <p className="mt-3 text-muted">Dated owner records, retained in shared workspace memory. One saved planning brief per UTC day. Preparation currently requires this button; no daily scheduler or fresh-market research feed is connected.</p>
    <BriefingButton />
    {rows === null ? <p className="mt-8">Briefing records unavailable.</p> : !rows.length ? <p className="mt-8">No saved briefings yet.</p> : <ul className="mt-8 grid gap-4">{rows.map((row) => <li key={text(row, "memory_key")} className="rounded-3xl border border-border bg-surface p-5"><h2 className="text-2xl">{text(row, "memory_key").split(".").at(-1)}</h2><p className="mt-3 whitespace-pre-wrap text-sm">{text(row, "memory_value")}</p></li>)}</ul>}
  </section>
}
