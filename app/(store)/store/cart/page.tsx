import { CartPanel } from "@/components/store/cart-panel"
import { storePaypalMode, storePaypalSdkSrc } from "@/lib/store/paypal"

export const dynamic = "force-dynamic"

export const metadata = { title: "Cart", robots: { index: false, follow: false } }

export default function CartPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Cart</p>
      <h1 className="display mt-3 text-5xl">Your cart</h1>
      <p className="mt-4 text-ink-soft">Published products from Studio. The three fixed offers on the store page check out on their own. The server prices whatever is in this cart.</p>
      <CartPanel sdkSrc={storePaypalSdkSrc()} sandbox={storePaypalMode() === "sandbox"} />
    </main>
  )
}
