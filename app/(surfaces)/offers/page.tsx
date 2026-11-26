import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { SurfaceFrame } from "@/components/surfaces/frame"
import { publishedOffers } from "@/lib/offers/public"
import { formatStorePrice } from "@/lib/store/catalog"
import { bareHost, surfaceForHost } from "@/lib/store/hosts"

export const dynamic = "force-dynamic"

const description = "Upsells, order bumps, and membership upgrades published from Studio. Upgrade pages use the existing DigiMark101 plans."

export async function generateMetadata(): Promise<Metadata> {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "offers"
  const canonical = onSurface ? "https://appdm101.ink/" : "https://www.digimark101.com/offers"
  return { title: { absolute: "Offers | DigiMark101" }, description, alternates: { canonical }, openGraph: { title: "Offers", description, url: canonical } }
}

export default async function OffersPage() {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "offers"
  const offers = await publishedOffers()
  const signIn = onSurface ? "https://www.digimark101.com/login?next=/offers" : "/login?next=/offers"

  return (
    <SurfaceFrame
      eyebrow="appdm101.ink"
      title="The offer after the yes."
      lede="Upsells and order bumps are one-time PayPal payments. A plan upgrade sends you to the membership page that already exists. Nothing here creates a new PayPal plan."
      signInHref={signIn}
      agencyHref={onSurface ? "https://www.digimark101.com" : "/"}
    >
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-8 md:grid-cols-3">
        {[
          ["Upsell", "A page after a purchase, with its own one-time price."],
          ["Order bump", "An add-on the buyer can take with a published offer."],
          ["Upgrade", "A page that points at the current membership plans."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-ink/10 p-5">
            <h2 className="font-serif text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{body}</p>
          </article>
        ))}
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="font-serif text-4xl">Published</h2>
        {offers.length === 0 ? (
          <p className="mt-4 max-w-2xl text-ink-soft">No offer is published. Create one in Studio → Offers, then publish it. Drafts stay off this domain.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <article key={offer.slug} className="rounded-3xl border border-ink/10 bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">{offer.kind}</p>
                <h3 className="mt-2 font-serif text-3xl">
                  <Link href={onSurface ? `/${offer.slug}` : `/offers/${offer.slug}`}>{offer.headline || offer.name}</Link>
                </h3>
                <p className="mt-2 text-ink-soft">{offer.amountCents ? formatStorePrice(offer.amountCents) : "Uses membership pricing"}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </SurfaceFrame>
  )
}
