import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { SurfaceFrame } from "@/components/surfaces/frame"
import { StoreBuyPanel } from "@/components/store/buy-buttons"
import { publishedOffer } from "@/lib/offers/public"
import { formatStorePrice } from "@/lib/store/catalog"
import { bareHost, surfaceForHost } from "@/lib/store/hosts"
import { storePaypalMode, storePaypalSdkSrc } from "@/lib/store/paypal"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const offer = await publishedOffer(slug)
  if (!offer) return { title: "Offer" }
  return { title: { absolute: `${offer.headline || offer.name} | DigiMark101` }, description: offer.body.slice(0, 180) || offer.name }
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const offer = await publishedOffer(slug)
  if (!offer) notFound()
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "offers"
  const signIn = onSurface ? "https://www.digimark101.com/login?next=/offers" : "/login?next=/offers"

  return (
    <SurfaceFrame
      eyebrow={offer.kind}
      title={offer.headline || offer.name}
      lede={offer.body || "A published offer from Studio."}
      signInHref={signIn}
      agencyHref={onSurface ? "https://www.digimark101.com" : "/"}
    >
      <section className="mx-auto max-w-xl px-5 pb-16">
        <div className="rounded-[1.75rem] border border-ink/10 bg-card p-6">
          {offer.kind === "upgrade" || !offer.amountCents ? (
            <>
              <p className="text-ink-soft">This upgrade uses the membership plans already on DigiMark101. It does not create a new PayPal plan.</p>
              <p className="mt-5">
                <Link className="btn btn-signal" href="https://www.digimark101.com/pricing">
                  {offer.cta || "See membership"}
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold">{formatStorePrice(offer.amountCents)}</p>
              <p className="mt-2 text-sm text-ink-soft">One-time. PayPal plans are not changed.</p>
              <StoreBuyPanel sku={offer.slug} endpoint="/api/offers/checkout" sdkSrc={storePaypalSdkSrc()} sandbox={storePaypalMode() === "sandbox"} />
            </>
          )}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          <Link href={onSurface ? "/" : "/offers"}>All offers</Link>
        </p>
      </section>
    </SurfaceFrame>
  )
}
