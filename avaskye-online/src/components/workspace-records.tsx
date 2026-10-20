import { deskRowsMaybe, requireOwner, text } from "@/lib/desk"
import { WorkspaceForm } from "@/components/workspace-form"

const views = {
  calendar: { title: "Calendar", table: "appointments", query: "select=id,owner_id,title,contact_name,starts_at,notes&order=starts_at.desc&limit=100", fields: ["owner_id", "contact_name", "starts_at", "notes"], heading: "title", note: "Shared appointments across customer workspaces. Times below are stored UTC timestamps." },
  inbox: { title: "Inbox", table: "threads", query: "select=id,owner_id,contact_name,subject,created_at&order=created_at.desc&limit=100", fields: ["owner_id", "contact_name", "created_at"], heading: "subject", note: "Shared studio conversation records, not an external email inbox." },
  memory: { title: "Memory", table: "client_memory", query: "select=id,owner_id,memory_key,memory_value,updated_at&order=updated_at.desc&limit=100", fields: ["owner_id", "memory_value", "updated_at"], heading: "memory_key", note: "Private customer workspace memories. Only the verified office owner can view these platform-wide records." },
  files: { title: "Files", table: "client_files", query: "select=id,owner_id,filename,path,created_at&order=created_at.desc&limit=100", fields: ["owner_id", "path", "created_at"], heading: "filename", note: "Shared file metadata only. Private files are not made public and no unsigned download links are generated." },
} as const

export async function WorkspaceRecords({ kind }: { kind: keyof typeof views }) {
  if (!(await requireOwner())) return null
  const view = views[kind]
  const rows = await deskRowsMaybe(view.table, view.query)
  const messages = kind === "inbox" ? await deskRowsMaybe("thread_messages", "select=id,thread_id,body,sender,created_at&order=created_at.desc&limit=200") : null
  return (
    <section>
      <h1 className="text-5xl">{view.title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{view.note} Showing up to 100 records.</p>
      {kind === "calendar" || kind === "memory" ? <WorkspaceForm kind={kind} /> : null}
      {rows === null ? <p className="mt-8 text-muted">Shared data unavailable. Check server credentials and the table schema.</p> : rows.length === 0 ? <p className="mt-8 text-muted">No records yet.</p> : <ul className="mt-8 grid gap-4">{rows.map((row) => <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="text-2xl">{text(row, view.heading) || "Untitled"}</h2>
        {view.fields.map((field) => <p key={field} className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">{field.replaceAll("_", " ")}: {text(row, field) || "—"}</p>)}
        {kind === "inbox" ? messages === null ? <p className="mt-3 text-sm">Messages unavailable.</p> : messages.filter((message) => text(message, "thread_id") === text(row, "id")).map((message) => <p key={text(message, "id")} className="mt-3 whitespace-pre-wrap text-sm">{text(message, "sender")}: {text(message, "body")}</p>) : null}
      </li>)}</ul>}
      {kind === "inbox" ? <p className="mt-4 text-xs text-muted">Messages are limited to the latest 200 platform-wide; older messages are not included.</p> : null}
    </section>
  )
}
