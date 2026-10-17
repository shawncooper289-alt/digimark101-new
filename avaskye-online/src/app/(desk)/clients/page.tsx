import { deskClients, deskRows, text } from "@/lib/desk"

export default async function ClientsPage() {
  const [clients, contacts] = await Promise.all([
    deskClients(),
    deskRows("contacts", "select=owner_id&limit=1000"),
  ])
  const counts = new Map<string, number>()
  for (const row of contacts) counts.set(text(row, "owner_id"), (counts.get(text(row, "owner_id")) || 0) + 1)
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Clients</h1>
      <p className="mt-3 max-w-2xl text-muted">Accounts in the shared Supabase project. A customer role cannot open this office.</p>
      {clients.length === 0 ? <p className="mt-8 text-muted">No accounts could be listed. The service role is required.</p> : (
        <ul className="mt-8 grid gap-3">
          {clients.map((client) => (
            <li key={client.id} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{client.email}</p>
              <p className="text-sm text-muted">{client.role} · {counts.get(client.id) || 0} contacts in the latest thousand · {client.id}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
