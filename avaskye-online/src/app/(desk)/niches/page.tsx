import { deskRows, text } from "@/lib/desk"

export default async function NichesPage() {
  const rows = await deskRows("lead_niches", "select=key,label,words&order=label.asc&limit=200")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Niches</h1>
      <p className="mt-3 max-w-2xl text-muted">Product niches used to sort and promote leads.</p>
      {rows.length === 0 ? <p className="mt-8 text-muted">No niches yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {rows.map((row) => (
            <li key={text(row, "key")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "label")}</p>
              <p className="text-sm text-muted">{Array.isArray(row.words) ? (row.words as string[]).join(", ") : ""}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
