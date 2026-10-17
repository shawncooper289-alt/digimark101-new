import { deskRows, text } from "@/lib/desk"

export default async function ToolsPage() {
  const backends = await deskRows("managed_backends", "select=id,name,region,status,project_ref&order=created_at.desc&limit=50")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Tools</h1>
      <p className="mt-3 max-w-2xl text-muted">Internal provisioning records. API keys stay on the DigiMark101 server and are not listed here.</p>
      <ul className="mt-6 grid gap-2 text-sm text-muted">
        <li>Lead qualifier: hourly on digimark101.com at /api/cron/leads.</li>
        <li>Managed backends are created from the customer studio, then reviewed here.</li>
      </ul>
      {backends.length === 0 ? <p className="mt-8 text-muted">No managed backends are recorded.</p> : (
        <ul className="mt-8 grid gap-3">
          {backends.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "name")}</p>
              <p className="text-sm text-muted">{text(row, "region")} · {text(row, "status")} · {text(row, "project_ref")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
