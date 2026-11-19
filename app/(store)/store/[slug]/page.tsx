import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToCart } from "@/components/store/add-button"
import { StoreBuyPanel } from "@/components/store/buy-buttons"
import { publishedProducts } from "@/lib/offers/public"
import { formatStorePrice } from "@/lib/store/catalog"
import { storePaypalMode, storePaypalSdkSrc } from "@/lib/store/paypal"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = (await publishedProducts()).find((item) => item.slug === slug)
  if (!product) return { title: "Product" }
  return { title: product.name, description: product.description || product.name }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = (await publishedProducts()).find((item) => item.slug === slug)
  if (!product) notFound()

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">{product.kind}</p>
      <h1 className="display mt-3 text-5xl">{product.name}</h1>
      <p className="mt-4 text-3xl font-semibold">{formatStorePrice(product.amountCents)}</p>
      <p className="mt-4 text-ink-soft">{product.description || "A published product from Studio."}</p>
      {product.kind === "token" ? <p className="mt-3 text-sm text-ink-soft">{product.credits.toLocaleString()} credits, applied when you are signed in with the PayPal email.</p> : null}
      {product.kind === "prompt_pack" ? <p className="mt-3 text-sm text-ink-soft">The prompt text is saved to your workspace after payment. It is not shown here.</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <AddToCart slug={product.slug} name={product.name} />
        <Link className="btn btn-ghost" href="/store/cart">
          View cart
        </Link>
      </div>
      <StoreBuyPanel sku={product.slug} endpoint="/api/store/cart" payload={{ items: [{ slug: product.slug, qty: 1 }] }} sdkSrc={storePaypalSdkSrc()} sandbox={storePaypalMode() === "sandbox"} />
      <p className="mt-6">
        <Link className="text-sm text-ink-soft" href="/store">
          Back to the store
        </Link>
      </p>
    </main>
  )
}
