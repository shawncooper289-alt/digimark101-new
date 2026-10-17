import { ReleaseList, RequestList } from "@/components/leads/marketplace-actions"
import { PageHeader } from "@/components/site/page-header"
import { previewPools } from "@/lib/leads/engine"
import { pageMetadata } from "@/lib/seo"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata = pageMetadata({
  title: "Lead lists",
  description: "Anonymized premium lead lists by niche. Contact details stay hidden until a paid order.",
  path: "/marketplace",
})

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

export default async function MarketplacePage() {
  const [pools, session] = await Promise.all([previewPools(), currentUser()])
  const signedIn = Boolean(session.user)

  return (
    <>
      <PageHeader
        eyebrow="Lead lists"
        title="Premium lists, without the names."
        lede="Each card is a niche pool of leads that already cleared the score threshold and allowed sharing. You see the niche, region, company size, and score. Names, emails, and phone numbers stay hidden until an order is paid."
      />
      <div className="mx-auto max-w-6xl px-5 py-14">
        {pools.length === 0 ? (
          <p className="max-w-2xl text-ink-soft">
            No premium list is published right now. Leads enter from the contact form, Ava (only when someone explicitly asks to be contacted), and connected sources. The hourly job scores them. Anything under the threshold, or without permission to share, is not shown here.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pools.map((pool) => (
              <article key={pool.niche} className="rounded-3xl border border-ink/10 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">{LABELS[pool.niche] ?? pool.niche}</p>
                <h2 className="mt-2 font-serif text-3xl">{pool.count} premium {pool.count === 1 ? "lead" : "leads"}</h2>
                <dl className="mt-4 grid gap-2 text-sm text-ink-soft">
                  <div>
                    <dt className="text-ink">Score</dt>
                    <dd>{pool.scoreMin === pool.scoreMax ? pool.scoreMin : `${pool.scoreMin}–${pool.scoreMax}`}</dd>
                  </div>
                  <div>
                    <dt className="text-ink">Region</dt>
                    <dd>{pool.regions.join(", ") || "Unspecified"}</dd>
                  </div>
                  <div>
                    <dt className="text-ink">Company size</dt>
                    <dd>{pool.sizes.join(", ") || "Unspecified"}</dd>
                  </div>
                </dl>
                <RequestList niche={pool.niche} signedIn={signedIn} />
              </article>
            ))}
          </div>
        )}
        <ReleaseList signedIn={signedIn} />
        <p className="mt-8 max-w-2xl text-sm text-ink-soft">
          Requesting a list does not charge a card. Checkout is not connected, so a request stays pending until it is marked paid. DigiMark101 can also keep a premium list for its own use when the person allowed contact but did not allow sharing. Those leads are not on this page.
        </p>
      </div>
    </>
  )
}
