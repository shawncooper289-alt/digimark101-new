import { deskRows, text } from "@/lib/desk"

export default async function CampaignsPage() {
  const rows = await deskRows("campaigns", "select=id,name,channel,status,brief,created_at&order=created_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Campaigns</h1>
      <p className="mt-3 max-w-2xl text-muted">Your own campaigns, including DigiMark101. Same Supabase table the main site writes to.</p>
      {rows.length === 0 ? <p className="mt-8 text-muted">No campaigns yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {rows.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "name")} · {text(row, "status")}</p>
              <p className="text-sm text-muted">{text(row, "channel")}</p>
              {text(row, "brief") ? <p className="mt-2 text-sm">{text(row, "brief")}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
