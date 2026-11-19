import { ConfirmOrder } from "@/components/leads/confirm-order"
import { ownerLeadCounts } from "@/lib/leads/engine"
import { ensureOwnerGranted } from "@/lib/owner/access"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const LABELS: Record<string, string> = {
  seo: "SEO",
  "paid-ads": "Paid ads",
  social: "Social",
  content: "Content",
  web: "Web",
  email: "Email",
  analytics: "Analytics",
  ai: "AI automation",
  general: "General",
}

export default async function StudioLeadsPage() {
  const { user } = await currentUser()
  await ensureOwnerGranted(user)
  const counts = await ownerLeadCounts(user)

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Leads</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        This list is only the premium store: scored, niche-separated, and still available. Staging and rejected rows stay hidden. No addresses are shown on this page.
      </p>
      {!counts.allowed ? (
        <p className="mt-8 max-w-2xl text-ink-soft">The premium inventory is limited to the owner account. Buyers browse anonymized lists on the public lead-lists page.</p>
      ) : null}
      {counts.allowed && !counts.ready ? (
        <p className="mt-8 max-w-2xl text-ink-soft">The lead engine needs the Supabase service role and a hash salt before it can read the store.</p>
      ) : null}
      {counts.allowed && counts.ready ? (
        <>
          <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-card p-4">
              <dt className="text-ink-soft">Premium threshold</dt>
              <dd className="mt-1 font-serif text-3xl">{counts.threshold}</dd>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-card p-4">
              <dt className="text-ink-soft">Enrichment</dt>
              <dd className="mt-1 font-serif text-3xl">{counts.enrichment === "configured" ? "On" : "Off"}</dd>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-card p-4">
              <dt className="text-ink-soft">Connectors</dt>
              <dd className="mt-1 font-serif text-3xl">{counts.connectors}</dd>
            </div>
          </dl>
          {counts.niches.length === 0 ? (
            <p className="mt-8 text-ink-soft">No premium lead is in the store yet. The hourly job promotes one only after it clears the threshold.</p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <caption className="sr-only">Premium leads by niche</caption>
                <thead className="text-ink-soft">
                  <tr>
                    <th className="border-b border-ink/10 py-2 font-medium">Niche</th>
                    <th className="border-b border-ink/10 py-2 font-medium">Premium</th>
                    <th className="border-b border-ink/10 py-2 font-medium">Sellable</th>
                    <th className="border-b border-ink/10 py-2 font-medium">Own use</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.niches.map((niche) => (
                    <tr key={niche.niche}>
                      <td className="border-b border-ink/10 py-3">{LABELS[niche.niche] ?? niche.niche}</td>
                      <td className="border-b border-ink/10 py-3">{niche.premium}</td>
                      <td className="border-b border-ink/10 py-3">{niche.sellable}</td>
                      <td className="border-b border-ink/10 py-3">{niche.ownUse}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-6 max-w-2xl text-sm text-ink-soft">
            Capture is automatic: the contact form, an explicit Ava consent, CSV or API import, and HTTPS connectors configured with env vars. The scheduled job pulls connectors, scores staging, and moves only premium leads here. There is no manual add form.
          </p>
          <ConfirmOrder />
        </>
      ) : null}
    </section>
  )
}
