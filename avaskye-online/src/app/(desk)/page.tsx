import { deskSnapshot } from "@/lib/desk"

function figure(label: string, value: number | null) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-3xl">{value === null ? "—" : value}</p>
    </article>
  )
}

export default async function TodayPage() {
  const snap = await deskSnapshot()
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Today</h1>
      <p className="mt-3 max-w-2xl text-muted">Counts come from the same Supabase project as digimark101.com. A dash means that table could not be read.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {figure("Premium leads", snap.premium)}
        {figure("Staging", snap.staging)}
        {figure("Rejected", snap.rejected)}
        {figure("Contacts", snap.contacts)}
        {figure("Deals", snap.deals)}
        {figure("Automations on", snap.automations)}
        {figure("Subscriptions", snap.subscriptions)}
        {figure("Lead orders", snap.orders)}
      </div>
    </section>
  )
}
