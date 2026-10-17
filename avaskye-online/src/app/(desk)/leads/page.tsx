import { deskRows, text } from "@/lib/desk"

export default async function LeadsPage() {
  const [contacts, records, staging] = await Promise.all([
    deskRows("lead_private_contacts", "select=id,email,full_name,phone,company,lead_id,staging_id,notes,created_at&order=created_at.desc&limit=100"),
    deskRows("lead_records", "select=id,niche,region,company_size,score&limit=300"),
    deskRows("lead_staging", "select=id,niche,region,company_size,score&limit=300"),
  ])
  const byId = new Map<string, Record<string, unknown>>()
  for (const row of [...records, ...staging]) byId.set(text(row, "id"), row)

  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Leads</h1>
      <p className="mt-3 max-w-2xl text-muted">Private contact details are shown here for the owner only. Customers on digimark101.com see anonymized previews, and only after a paid release.</p>
      {contacts.length === 0 ? <p className="mt-8 text-muted">No private contacts are stored yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {contacts.map((row) => {
            const linked = byId.get(text(row, "lead_id")) || byId.get(text(row, "staging_id"))
            return (
              <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
                <p className="font-medium">{text(row, "full_name") || "Unnamed"} · {text(row, "email")}</p>
                <p className="text-sm text-muted">{[text(row, "phone"), text(row, "company")].filter(Boolean).join(" · ") || "No phone or company"}</p>
                <p className="text-sm text-muted">{linked ? `${text(linked, "niche")} · ${text(linked, "region")} · score ${text(linked, "score")}` : text(row, "lead_id") ? "Premium record" : "Still in staging"}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
