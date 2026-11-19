import type { Metadata } from "next"
import Link from "next/link"
import { headers } from "next/headers"
import { formatStorePrice, productBySku } from "@/lib/store/catalog"
import { applyStoreCredits, deliverySecret, downloadPathFor, orderForReceipt } from "@/lib/store/fulfill"
import { bareHost, isStoreHost } from "@/lib/store/hosts"
import { deliverySigOk, isOrderId } from "@/lib/store/token"
import { isOwnerIdentity } from "@/lib/owner/access"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; exp?: string; sig?: string }>
}) {
  const params = await searchParams
  const orderId = params.order || ""
  const exp = Number(params.exp)
  const sig = params.sig || ""
  const secret = deliverySecret()
  const sigOk = deliverySigOk(orderId, exp, sig, secret)
  const { user } = await currentUser()
  if (user) {
    try {
      await applyStoreCredits({ id: user.id, email: user.email })
    } catch {
      // The ledger is filled when the migration is applied.
    }
  }
  const order = isOrderId(orderId)
    ? await orderForReceipt(orderId, {
        sigOk,
        viewer: user ? { id: user.id, email: user.email, owner: isOwnerIdentity(user) } : null,
      }).catch(() => null)
    : null
  const product = order ? productBySku(order.sku) : null
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  const signIn = isStoreHost(host)
    ? `https://www.digimark101.com/login?next=${encodeURIComponent("/store/confirmation")}`
    : "/login?next=/store/confirmation"
  const download = order && product && product.kind !== "credits" ? downloadPathFor(order.id) : ""

  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Order</p>
      <h1 className="display mt-3 text-5xl">{order ? "You are paid." : "This receipt is not open."}</h1>
      {order && !product ? (
        <>
          <p className="mt-4 text-ink-soft">
            {order.title} · {formatStorePrice(order.amount_cents)}. PayPal captured the payment.
          </p>
          <p className="mt-4 text-ink-soft">
            {order.delivery === "crm"
              ? "Leads that were still consented are in your Studio contacts. Nothing personal was shown before payment."
              : "This payment is recorded. Credits and prompt packs land in the workspace when you are signed in with the PayPal email."}
          </p>
        </>
      ) : null}
      {order && product ? (
        <>
          <p className="mt-4 text-ink-soft">
            {order.title} · {formatStorePrice(order.amount_cents)}. PayPal captured the payment. This was a one-time charge.
          </p>
          {product.kind === "credits" ? (
            <p className="mt-4 text-ink-soft">
              {product.credits?.toLocaleString()} credits are tied to {order.buyer_email || "the PayPal email"}. Sign in with that email and they are added to the workspace.
              {user ? " If this login matches, they are applied now." : ""}
            </p>
          ) : null}
          {download ? (
            <p className="mt-6">
              <a className="btn btn-signal" href={download}>
                {product.kind === "leads" ? "Download the lead CSV" : "Download the prompt pack"}
              </a>
            </p>
          ) : product.kind !== "credits" ? (
            <p className="mt-4 text-ink-soft">The order is saved. The download link appears when the server has a signing secret.</p>
          ) : null}
          {product.kind === "leads" ? (
            <p className="mt-4 text-sm text-ink-soft">
              The file contains only leads that allowed sharing and have not opted out. If someone opts out later, they are removed from the next download.
            </p>
          ) : null}
          <p className="mt-6 text-sm text-ink-soft">A note of this sale is on the owner order list in Studio.</p>
        </>
      ) : (
        <p className="mt-4 text-ink-soft">The link is missing, expired, or the payment is not recorded yet. If you just paid, refresh once. Otherwise sign in with the PayPal email.</p>
      )}
      <p className="mt-8 flex gap-3">
        <Link className="btn btn-ghost" href="/store">
          Back to the store
        </Link>
        <Link className="btn btn-ghost" href={signIn}>
          Sign in
        </Link>
      </p>
    </main>
  )
}
