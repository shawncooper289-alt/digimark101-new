import { publishedProducts } from "@/lib/offers/public"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { startCheckout } from "@/lib/store/fulfill"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`store-cart:${clientIp(request)}`, 20)) return Response.json({ error: "Too many requests." }, { status: 429 })
  let body: { items?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const requested = Array.isArray(body.items) ? body.items : []
  const products = await publishedProducts()
  const items: { productId: string; qty: number; slug: string }[] = []
  let amountCents = 0
  for (const item of requested.slice(0, 12)) {
    if (!item || typeof item !== "object") continue
    const slug = String((item as { slug?: string }).slug || "")
    const qty = Math.min(10, Math.max(1, Math.round(Number((item as { qty?: number }).qty) || 1)))
    const product = products.find((row) => row.slug === slug)
    if (!product || product.amountCents <= 0) continue
    items.push({ productId: product.id, qty, slug })
    amountCents += product.amountCents * qty
  }
  if (!items.length) return Response.json({ error: "The cart is empty." }, { status: 400 })
  const { user } = await currentUser()
  const result = await startCheckout({
    sku: "catalog-cart",
    title: "Store cart",
    amountCents,
    delivery: "catalog",
    buyerId: user?.id ?? null,
    detail: { items },
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ paypalOrderId: result.paypalOrderId })
}
