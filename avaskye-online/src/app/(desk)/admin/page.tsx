import { deskClients, deskCount, deskRows, text } from "@/lib/desk"

export default async function AdminPage() {
  const [clients, workspaces, backends, contacts, campaigns, leads] = await Promise.all([
    deskClients(),
    deskRows("workspaces", "select=id,owner_id,name,personal,created_at&order=created_at.desc&limit=200"),
    deskRows("managed_backends", "select=id,owner_id,name,project_ref,region,status,created_at&order=created_at.desc&limit=100"),
    deskCount("contacts"),
    deskCount("campaigns"),
    deskCount("lead_staging"),
  ])
  const email = new Map(clients.map((c) => [c.id, c.email]))
  const stats = [
    ["Accounts", clients.length],
    ["Workspaces", workspaces.length],
    ["Contacts", contacts],
    ["Campaigns", campaigns],
    ["Staged leads", leads],
  ] as const
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Admin</h1>
      <p className="mt-3 max-w-2xl text-muted">Read-only view of digimark101.com: its accounts, workspaces and white-label backends, from the shared Supabase project.</p>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-border bg-surface p-4">
            <dt className="text-xs uppercase tracking-[0.18em] text-muted">{label}</dt>
            <dd className="mt-1 text-2xl">{value ?? "n/a"}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-10 text-2xl">Workspaces</h2>
      {workspaces.length === 0 ? <p className="mt-3 text-muted">None listed.</p> : (
        <ul className="mt-3 grid gap-3">
          {workspaces.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "name")}{row.personal ? " · personal" : ""}</p>
              <p className="text-sm text-muted">{email.get(text(row, "owner_id")) || text(row, "owner_id")}</p>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-10 text-2xl">Managed backends</h2>
      {backends.length === 0 ? <p className="mt-3 text-muted">None provisioned.</p> : (
        <ul className="mt-3 grid gap-3">
          {backends.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "name")} · {text(row, "status")}</p>
              <p className="text-sm text-muted">{email.get(text(row, "owner_id")) || text(row, "owner_id")} · {text(row, "project_ref")} · {text(row, "region")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
