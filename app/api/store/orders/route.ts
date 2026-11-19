import { createStoreCheckout } from "@/lib/store/fulfill"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`store-order:${clientIp(request)}`, 20)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 })
  }
  let body: { sku?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const sku = typeof body.sku === "string" ? body.sku : ""
  const { user } = await currentUser()
  const result = await createStoreCheckout(sku, user?.id ?? null)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ paypalOrderId: result.paypalOrderId })
}
