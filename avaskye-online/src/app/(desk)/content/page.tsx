import { ContentEditor } from "@/components/content-editor"
import { deskRowsMaybe, requireOwner, text } from "@/lib/desk"

export default async function ContentPage() {
  if (!(await requireOwner())) return null
  const rows = await deskRowsMaybe("sites", "select=id,owner_id,name,path,status,headline&order=created_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl">Platform content</h1>
      <p className="mt-3 max-w-2xl text-muted">The latest 100 site records from DigiMark101’s shared database. Confirmed edits change the stored name and headline for that customer. They do not deploy the main website, publish a page, or send a campaign.</p>
      {rows === null ? <p className="mt-8 text-muted">Content is unavailable. Check the server administration key and shared sites table before editing.</p> : rows.length === 0 ? <p className="mt-8 text-muted">No site records yet.</p> : (
        <ul className="mt-8 grid gap-4">
          {rows.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-5">
              <h2 className="text-2xl">{text(row, "name")}</h2>
              <p className="mt-2 break-all text-sm text-muted">{text(row, "status")} · {text(row, "path") || "No path"} · Customer {text(row, "owner_id")}</p>
              <ContentEditor key={`${text(row, "id")}:${text(row, "name")}:${text(row, "headline")}`} id={text(row, "id")} initialName={text(row, "name")} initialHeadline={text(row, "headline")} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
