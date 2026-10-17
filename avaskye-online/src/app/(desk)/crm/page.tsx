import { deskRows, text } from "@/lib/desk"

export default async function CrmPage() {
  const contacts = await deskRows("contacts", "select=id,name,email,phone,company,notes,created_at&order=created_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>CRM</h1>
      <p className="mt-3 max-w-2xl text-muted">Contacts from every client workspace. Ask Ava to draft one, then confirm it before it is saved.</p>
      {contacts.length === 0 ? <p className="mt-8 text-muted">No contacts yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {contacts.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "name")}</p>
              <p className="text-sm text-muted">{[text(row, "email"), text(row, "phone"), text(row, "company")].filter(Boolean).join(" · ") || "No details"}</p>
              {text(row, "notes") ? <p className="mt-2 text-sm">{text(row, "notes")}</p> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">New contacts are added from Ava’s draft. Nothing is saved until you confirm.</p>
    </section>
  )
}
