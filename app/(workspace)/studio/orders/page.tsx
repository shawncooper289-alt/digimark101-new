import Link from "next/link"
import { formatStorePrice } from "@/lib/store/catalog"
import { listStoreOrders, receiptPathFor } from "@/lib/store/fulfill"
import { isOwnerIdentity } from "@/lib/owner/access"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function StudioOrdersPage() {
  const { user } = await currentUser()
  const owner = isOwnerIdentity(user)
  const listed = owner ? await listStoreOrders() : { ready: false, orders: [] }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Store orders</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Sales from the one-time store. This list is the owner notification. The buyer gets the file on the confirmation page. Nothing here changes a PayPal plan.
      </p>
      {!owner ? (
        <p className="mt-8 max-w-2xl text-ink-soft">Store sales are visible to the owner account.</p>
      ) : null}
      {owner && !listed.ready ? (
        <p className="mt-8 max-w-2xl text-ink-soft">
          Apply supabase/migrations/20261120_store_orders.sql and set the Supabase service role. Orders will show here after that.
        </p>
      ) : null}
      {owner && listed.ready && listed.orders.length === 0 ? (
        <p className="mt-8 text-ink-soft">No store orders yet.</p>
      ) : null}
      {owner && listed.orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Store orders</caption>
            <thead className="text-ink-soft">
              <tr>
                <th className="border-b border-ink/10 py-2 font-medium">Product</th>
                <th className="border-b border-ink/10 py-2 font-medium">Amount</th>
                <th className="border-b border-ink/10 py-2 font-medium">Buyer</th>
                <th className="border-b border-ink/10 py-2 font-medium">Status</th>
                <th className="border-b border-ink/10 py-2 font-medium">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {listed.orders.map((order) => (
                <tr key={order.id}>
                  <td className="border-b border-ink/10 py-3">{order.title}</td>
                  <td className="border-b border-ink/10 py-3">{formatStorePrice(order.amount_cents)}</td>
                  <td className="border-b border-ink/10 py-3">{order.buyer_email || "—"}</td>
                  <td className="border-b border-ink/10 py-3">{order.status}</td>
                  <td className="border-b border-ink/10 py-3">
                    {order.status === "paid" ? (
                      <Link href={receiptPathFor(order.id) || `/store/confirmation?order=${order.id}`}>Open</Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
