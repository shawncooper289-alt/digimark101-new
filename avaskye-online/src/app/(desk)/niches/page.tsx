import { deskCount, deskRowsMaybe, requireOwner, text } from "@/lib/desk"
export default async function NichesPage() {
  if (!(await requireOwner())) return null
  const niches = await deskRowsMaybe("lead_niches", "select=key,label,words&order=label.asc")
  const rows = niches ? await Promise.all(niches.map(async (niche) => {
    const key = text(niche, "key")
    const filter = `niche=eq.${encodeURIComponent(key)}&premium=eq.true`
    const [premium, available] = await Promise.all([
      deskCount("lead_records", filter),
      deskCount("lead_records", `${filter}&sellable=eq.true&consent_share=eq.true`),
    ])
    return { key, label: text(niche, "label"), premium, available }
  })) : null
  return <section><h1 className="text-5xl">Niche lead inventory</h1>
    <p className="mt-3 text-muted">Saved niche directory from the shared database. Exact current counts, not a sample. Available means premium, sellable, and sharing consent recorded; it is not a promise of exclusive or unallocated stock. No private contact data is published.</p>
    {rows === null ? <p className="mt-8">Directory unavailable. Check the administration key and schema.</p> : !rows.length ? <p className="mt-8">No niches are recorded.</p> : <div className="mt-8 overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Niche</th><th>Premium</th><th>Available to share</th></tr></thead><tbody>{rows.map((row) => <tr key={row.key} className="border-t border-border"><td className="py-4">{row.label || row.key}</td><td>{row.premium ?? "Unavailable"}</td><td>{row.available ?? "Unavailable"}</td></tr>)}</tbody></table></div>}
    <p className="mt-6 text-sm text-muted">Counts refresh on each page request. A missing niche registry is reported rather than replaced with a made-up list.</p>
  </section>
}
