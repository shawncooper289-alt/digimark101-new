import { captureStoreCheckout } from "@/lib/store/fulfill"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`store-capture:${clientIp(request)}`, 20)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 })
  }
  let body: { paypalOrderId?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const paypalOrderId = typeof body.paypalOrderId === "string" ? body.paypalOrderId : ""
  const result = await captureStoreCheckout(paypalOrderId)
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status })
  return Response.json({ confirmationPath: result.confirmationPath })
}
