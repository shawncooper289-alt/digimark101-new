import { publishedOffer } from "@/lib/offers/public"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { startCheckout } from "@/lib/store/fulfill"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`offer-checkout:${clientIp(request)}`, 20)) return Response.json({ error: "Too many requests." }, { status: 429 })
  let body: { sku?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const slug = typeof body.sku === "string" ? body.sku : ""
  const offer = await publishedOffer(slug)
  if (!offer) return Response.json({ error: "That offer is not published." }, { status: 404 })
  if (offer.kind === "upgrade" || !offer.amountCents) return Response.json({ error: "This offer uses the existing membership page." }, { status: 400 })
  const { user } = await currentUser()
  const result = await startCheckout({
    sku: `offer:${offer.slug}`,
    title: offer.name,
    amountCents: offer.amountCents,
    delivery: "offer",
    buyerId: user?.id ?? null,
  })
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ paypalOrderId: result.paypalOrderId })
}
