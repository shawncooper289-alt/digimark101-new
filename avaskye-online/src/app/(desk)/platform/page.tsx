import Link from "next/link"
import { deskCount, requireOwner } from "@/lib/desk"
import { officeConfig } from "@/lib/office-store"

const areas = [
  { href: "/clients", title: "Customers", table: "contacts", description: "Review customer accounts and their contacts." },
  { href: "/leads", title: "Leads", table: "lead_records", description: "Review qualified leads, staging, and rejected records." },
  { href: "/crm", title: "CRM", table: "contacts", description: "Add contacts to customer workspaces." },
  { href: "/pipeline", title: "Pipeline", table: "deals", description: "Review deals and confirm stage changes." },
  { href: "/content", title: "Content", table: "sites", description: "Edit shared site names and headlines. Main website code stays in GitHub." },
  { href: "/campaigns", title: "Campaigns", table: "campaigns", description: "Prepare campaigns and confirm status changes. Status is not delivery." },
  { href: "/automations", title: "Automations", table: "automations", description: "Create rules and enable or pause them." },
  { href: "/billing", title: "Payments & subscriptions", table: "subscriptions", description: "Review webhook-synced billing. No charges or refunds are made here." },
  { href: "/records", title: "Business records", table: "office_records", description: "Manage invoices, expenses, and legal records." },
  { href: "/reports", title: "Reports", table: "lead_orders", description: "Review shared operational reports, not visitor analytics." },
  { href: "/tools", title: "Infrastructure", table: "managed_backends", description: "Review managed backend provisioning records." },
] as const

export default async function PlatformPage() {
  if (!(await requireOwner())) return null
  const config = officeConfig()
  const counts = await Promise.all(areas.map((area) => deskCount(area.table)))
  return (
    <section>
      <p className="text-xs uppercase tracking-[0.18em] text-accent">Ava Skye · owner only</p>
      <h1 className="mt-3 text-5xl">DigiMark101 main office</h1>
      <p className="mt-4 max-w-3xl text-muted">Manage the shared platform here. DigiMark101 remains the customer-facing site; this office uses the same Supabase records, not a second copy.</p>
      <div className="mt-6 rounded-3xl border border-border bg-surface p-5">
        <h2 className="text-2xl">Connection checks</h2>
        <p className="mt-3 text-sm">Public connection: {config.url && config.anon ? "configured" : "missing"}. Server administration key: {config.service ? "present, validity checked by table reads below" : "missing; privileged management is unavailable"}.</p>
        <p className="mt-2 text-sm text-muted">A count means that table answered this request. Unavailable does not mean empty; check credentials, schema migrations, or provider availability. A successful read does not verify writes.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {areas.map((area, index) => (
          <Link key={area.href} href={area.href} className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="text-2xl">{area.title}</h2>
            <p className="mt-2 text-sm text-muted">{area.description}</p>
            <p className="mt-3 text-sm">{counts[index] === null ? "Shared table unavailable" : `${counts[index]} shared ${area.table.replaceAll("_", " ")} records`}</p>
          </Link>
        ))}
        <Link href="/settings" className="rounded-3xl border border-border bg-surface p-5">
          <h2 className="text-2xl">Ava & integrations</h2>
          <p className="mt-2 text-sm text-muted">Manage Ava’s office appearance and review missing server configuration. Credentials stay on the server.</p>
        </Link>
      </div>
      <p className="mt-8 text-sm text-muted">Customer checkout, PayPal webhooks, and scheduled lead processing continue on digimark101.com. This office does not move or duplicate those services.</p>
    </section>
  )
}
