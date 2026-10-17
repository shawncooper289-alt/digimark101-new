import { deskRows, text } from "@/lib/desk"

export default async function ReportsPage() {
  const [deals, leads] = await Promise.all([
    deskRows("deals", "select=stage&limit=500"),
    deskRows("lead_records", "select=niche,score&limit=500"),
  ])
  const stages = new Map<string, number>()
  for (const row of deals) stages.set(text(row, "stage") || "unknown", (stages.get(text(row, "stage") || "unknown") || 0) + 1)
  const niches = new Map<string, { count: number; score: number }>()
  for (const row of leads) {
    const niche = text(row, "niche") || "general"
    const current = niches.get(niche) || { count: 0, score: 0 }
    current.count += 1
    current.score += Number(text(row, "score")) || 0
    niches.set(niche, current)
  }
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Reports</h1>
      <p className="mt-3 max-w-2xl text-muted">These figures are counted from the latest 500 deals and premium leads. They are not a forecast.</p>
      <h2 className="mt-8 text-2xl">Deals by stage</h2>
      {stages.size === 0 ? <p className="mt-3 text-muted">No deals in that window.</p> : (
        <ul className="mt-3 grid gap-2">{[...stages.entries()].map(([stage, count]) => <li key={stage}>{stage}: {count}</li>)}</ul>
      )}
      <h2 className="mt-8 text-2xl">Premium leads by niche</h2>
      {niches.size === 0 ? <p className="mt-3 text-muted">No premium leads in that window.</p> : (
        <ul className="mt-3 grid gap-2">
          {[...niches.entries()].map(([niche, item]) => <li key={niche}>{niche}: {item.count} · average score {Math.round(item.score / item.count)}</li>)}
        </ul>
      )}
    </section>
  )
}
