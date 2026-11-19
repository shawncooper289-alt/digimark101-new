import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { SurfaceFrame } from "@/components/surfaces/frame"
import { StoreBuyPanel } from "@/components/store/buy-buttons"
import { nicheOffer } from "@/lib/leads/market"
import { formatStorePrice } from "@/lib/store/catalog"
import { bareHost, surfaceForHost } from "@/lib/store/hosts"
import { storePaypalMode, storePaypalSdkSrc } from "@/lib/store/paypal"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const { niche } = await params
  const offer = await nicheOffer(niche)
  if (!offer) return { title: "Lead list" }
  const description = `${offer.label} leads. Public page shows the count, region, company size, and score. Contact details stay hidden until purchase.`
  return { title: { absolute: `${offer.label} leads | DigiMark101` }, description }
}

export default async function NichePage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche } = await params
  const offer = await nicheOffer(niche)
  if (!offer) notFound()
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onSurface = surfaceForHost(host)?.id === "leads"
  const { user } = await currentUser()
  const next = `/leads/${offer.key}`
  const signIn = onSurface ? `https://www.digimark101.com/login?next=${encodeURIComponent(next)}` : `/login?next=${encodeURIComponent(next)}`
  const disabled =
    offer.priceCents === null
      ? "The owner has not set a price for this niche yet."
      : offer.count === 0
        ? "No consented leads are in stock."
        : undefined

  return (
    <SurfaceFrame
      eyebrow={offer.label}
      title={`${offer.label} leads`}
      lede="What you can see now is the niche, the count, and a sample of region, company size, and score. Names, emails, phone numbers, and companies are not on this page."
      signInHref={signIn}
      agencyHref={onSurface ? "https://www.digimark101.com" : "/"}
    >
      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-3xl font-semibold">{offer.count === null ? "Count unavailable" : `${offer.count} available`}</p>
          <p className="mt-2 text-ink-soft">{offer.priceCents ? `${formatStorePrice(offer.priceCents)} for up to ${offer.packSize} leads` : "No public price yet."}</p>
          <h2 className="mt-8 font-serif text-3xl">Sample, anonymized</h2>
          {offer.samples.length === 0 ? (
            <p className="mt-3 text-ink-soft">No public sample is in this niche right now.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {offer.samples.map((sample, index) => (
                <li key={`${sample.region}-${sample.companySize}-${index}`} className="rounded-2xl border border-ink/10 px-4 py-3 text-sm text-ink-soft">
                  Region {sample.region || "unspecified"} · Size {sample.companySize || "unspecified"} · Score {sample.score}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-sm text-ink-soft">
            A purchased lead is copied into your Studio contacts. Someone who did not allow sharing, or who opted out, is not included.{" "}
            <Link href={onSurface ? "/" : "/leads"}>All niches</Link>
          </p>
        </div>
        <aside className="rounded-[1.75rem] border border-ink/10 bg-card p-6">
          <h2 className="font-serif text-3xl">Buy this list</h2>
          {user && !disabled ? (
            <StoreBuyPanel sku={offer.key} endpoint="/api/leads/checkout" sdkSrc={storePaypalSdkSrc()} sandbox={storePaypalMode() === "sandbox"} />
          ) : (
            <>
              {disabled ? <p className="mt-4 text-sm text-ink-soft">{disabled}</p> : null}
              <p className="mt-4">
                <Link className="btn btn-signal" href={signIn}>
                  Sign in to buy
                </Link>
              </p>
              <p className="mt-3 text-sm text-ink-soft">Sign-in happens on digimark101.com, then you come back to this list. The session is the one on that site.</p>
            </>
          )}
        </aside>
      </section>
    </SurfaceFrame>
  )
}
