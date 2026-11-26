import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { JsonLd } from "@/components/site/json-ld"
import { StoreBuyPanel } from "@/components/store/buy-buttons"
import { STORE_PRODUCTS, toPublicProduct } from "@/lib/store/catalog"
import { isStoreHost, STORE_ORIGIN, bareHost } from "@/lib/store/hosts"
import { applyStoreCredits, countDeliverableLeads } from "@/lib/store/fulfill"
import { storePaypalMode, storePaypalSdkSrc } from "@/lib/store/paypal"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const description = "Buy an Ava prompt pack, an Ava credit bundle, or a consented niche lead list. One-time PayPal checkout. Delivered on the confirmation page."

export async function generateMetadata(): Promise<Metadata> {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onStore = isStoreHost(host)
  const canonical = onStore ? `${STORE_ORIGIN}/` : "https://www.digimark101.com/store"
  return {
    title: { absolute: "Ava prompts, credits, and a lead list | DigiMark101" },
    description,
    alternates: { canonical },
    openGraph: {
      title: "Ava prompts, credits, and a lead list",
      description,
      url: canonical,
      siteName: "DigiMark101",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DigiMark101 store" }],
    },
    twitter: { card: "summary_large_image", title: "Ava prompts, credits, and a lead list", description, images: ["/twitter-image"] },
  }
}

export default async function StorePage() {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const onStore = isStoreHost(host)
  const { user } = await currentUser()
  if (user) {
    try {
      await applyStoreCredits({ id: user.id, email: user.email })
    } catch {
      // Credits apply after the store migration is on the database.
    }
  }

  const products = STORE_PRODUCTS.map(toPublicProduct)
  let leadStock: number | null = null
  const lead = products.find((product) => product.kind === "leads")
  if (lead?.nicheKey) {
    try {
      leadStock = await countDeliverableLeads(lead.nicheKey)
    } catch {
      leadStock = null
    }
  }

  const sdkSrc = storePaypalSdkSrc()
  const sandbox = storePaypalMode() === "sandbox"
  const offers = products.map((product) => ({
    ...product,
    disabledReason:
      product.kind === "leads" && leadStock === 0
        ? "No consented leads are in stock for this niche right now."
        : undefined,
  }))

  return (
    <div className="bg-paper text-ink">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href={onStore ? "/" : "/"} aria-label="DigiMark101">
            <DigiMarkLogo variant="paper" compact />
          </Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Store">
            <Link className="text-ink-soft hover:text-ink" href={onStore ? "https://www.digimark101.com" : "/"}>
              Agency
            </Link>
            <Link className="btn btn-ghost" href={onStore ? "https://www.digimark101.com/login?next=/store" : "/login?next=/store"}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">appdm101.store</p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-7xl">Three things you can use today.</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-soft">
            A prompt pack, Ava credits, or a niche lead list. Pay once with PayPal. The file or the credits are on the confirmation page. This is not a subscription.
          </p>
        </section>
        <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-8 md:grid-cols-3" aria-label="Products">
          {offers.map((product) => (
            <article key={product.sku} className="flex flex-col rounded-[1.75rem] border border-ink/10 bg-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">
                {product.kind === "download" ? "Download" : product.kind === "credits" ? "Credits" : "Lead list"}
              </p>
              <h2 className="mt-3 font-serif text-3xl">{product.name}</h2>
              <p className="mt-3 text-3xl font-semibold">{product.priceLabel}</p>
              <p className="mt-3 text-ink-soft">{product.blurb}</p>
              {product.kind === "leads" && product.nicheLabel ? (
                <p className="mt-3 text-sm text-ink">
                  Niche: {product.nicheLabel}.{" "}
                  {leadStock === null
                    ? "The live count appears when the store database is connected."
                    : `${leadStock} consented ${leadStock === 1 ? "lead is" : "leads are"} in stock. You receive up to ${product.packSize}, and only leads that allowed sharing.`}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {product.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {product.preview.length ? (
                <div className="mt-4 rounded-2xl bg-mist p-4 text-sm text-ink-soft">
                  <p className="font-semibold text-ink">Two of the prompts</p>
                  {product.preview.map((line) => (
                    <p key={line} className="mt-2">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="mt-auto">
                <StoreBuyPanel sku={product.sku} sdkSrc={sdkSrc} sandbox={sandbox} disabledReason={product.disabledReason} />
              </div>
            </article>
          ))}
        </section>
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl">What happens after you pay</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-3xl border border-ink/10 p-5">
              <p className="font-semibold">1. PayPal confirms the payment</p>
              <p className="mt-2 text-sm text-ink-soft">The price is the price in the catalog. The button cannot change it, and it does not touch membership plans.</p>
            </li>
            <li className="rounded-3xl border border-ink/10 p-5">
              <p className="font-semibold">2. You land on a confirmation page</p>
              <p className="mt-2 text-sm text-ink-soft">The prompt pack and the lead list have a download link. Keep that link. It lasts 14 days.</p>
            </li>
            <li className="rounded-3xl border border-ink/10 p-5">
              <p className="font-semibold">3. Credits follow the PayPal email</p>
              <p className="mt-2 text-sm text-ink-soft">Sign in on digimark101.com with the same email and the credits land in that workspace.</p>
            </li>
          </ol>
          <div className="mt-10 max-w-3xl space-y-4 text-ink-soft">
            <h2 className="font-serif text-3xl text-ink">The lead list</h2>
            <p>
              Names, emails, and phone numbers are not on this page. The CSV is built after payment from leads that allowed contact and allowed sharing. A person who opted out is not included. The niche and the price are set in <span className="text-ink">lib/store/catalog.ts</span>.
            </p>
            <h2 className="font-serif text-3xl text-ink">Questions</h2>
            <p>Is this a subscription? No. Each button is a single PayPal payment.</p>
            <p>Where is the receipt? On the confirmation page, and on the owner order list in Studio.</p>
            <p>What if the file does not open? The order is stored. The owner can open the receipt link from Studio and send it again.</p>
          </div>
        </section>
      </main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "OfferCatalog",
          name: "DigiMark101 store",
          url: onStore ? `${STORE_ORIGIN}/` : "https://www.digimark101.com/store",
          itemListElement: offers.map((product) => ({
            "@type": "Offer",
            name: product.name,
            description: product.blurb,
            price: (product.priceCents / 100).toFixed(2),
            priceCurrency: "USD",
            availability: product.disabledReason ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          })),
        }}
      />
    </div>
  )
}
