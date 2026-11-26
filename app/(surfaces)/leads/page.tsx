import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { SurfaceFrame } from "@/components/surfaces/frame"
import { nicheOffers } from "@/lib/leads/market"
import { formatStorePrice } from "@/lib/store/catalog"
import { bareHost, surfaceForHost } from "@/lib/store/hosts"

export const dynamic = "force-dynamic"

const description = "Buy consented leads by niche. You see the count, region, company size, and score before you pay. Names and contact details stay hidden."

export async function generateMetadata(): Promise<Metadata> {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "leads"
  const canonical = onSurface ? "https://appdm101.online/" : "https://www.digimark101.com/leads"
  return {
    title: { absolute: "Lead lists by niche | DigiMark101" },
    description,
    alternates: { canonical },
    openGraph: { title: "Lead lists by niche", description, url: canonical, siteName: "DigiMark101" },
  }
}

export default async function LeadsIndexPage() {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "leads"
  const offers = await nicheOffers()
  const signIn = onSurface ? "https://www.digimark101.com/login?next=/leads" : "/login?next=/leads"

  return (
    <SurfaceFrame
      eyebrow="appdm101.online"
      title="Leads, by niche, without the names."
      lede="Each page is one niche from the lead catalog. The count and a sample of region, company size, and score are public. Personal details are delivered into your Studio contacts only after PayPal confirms payment."
      signInHref={signIn}
      agencyHref={onSurface ? "https://www.digimark101.com" : "/"}
    >
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
        {offers.map((offer) => (
          <article key={offer.key} className="rounded-3xl border border-ink/10 bg-card p-5">
            <h2 className="font-serif text-3xl">
              <Link href={onSurface ? `/${offer.key}` : `/leads/${offer.key}`}>{offer.label}</Link>
            </h2>
            <p className="mt-2 text-ink-soft">{offer.count === null ? "Count unavailable" : `${offer.count} consented ${offer.count === 1 ? "lead" : "leads"}`}</p>
            <p className="mt-2 text-sm text-ink">{offer.priceCents ? `${formatStorePrice(offer.priceCents)} for up to ${offer.packSize}` : "Price not set"}</p>
          </article>
        ))}
      </section>
    </SurfaceFrame>
  )
}
