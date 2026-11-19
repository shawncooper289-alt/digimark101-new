import { nicheOffer } from "@/lib/leads/market"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { startCheckout } from "@/lib/store/fulfill"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`lead-checkout:${clientIp(request)}`, 20)) return Response.json({ error: "Too many requests." }, { status: 429 })
  const { user } = await currentUser()
  if (!user) return Response.json({ error: "Sign in before buying a list. The leads go into your workspace." }, { status: 401 })
  let body: { sku?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const offer = await nicheOffer(typeof body.sku === "string" ? body.sku : "")
  if (!offer) return Response.json({ error: "That niche is not in the catalog." }, { status: 404 })
  if (!offer.priceCents || !offer.packSize) return Response.json({ error: "The owner has not set a price for this niche." }, { status: 409 })
  if (!offer.count) return Response.json({ error: "No consented leads are in stock for this niche." }, { status: 409 })
  const result = await startCheckout({
    sku: `market:${offer.key}`,
    title: `${offer.label} lead list`,
    amountCents: offer.priceCents,
    delivery: "crm",
    buyerId: user.id,
    detail: { niche: offer.key, packSize: Math.min(offer.packSize, offer.count) },
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ paypalOrderId: result.paypalOrderId })
}
