import { isHandledPaypalEvent } from "@/lib/paypal/events"
import { recordPaypalEvent } from "@/lib/paypal/store"
import { verifyPaypalWebhook } from "@/lib/paypal/verify"

export const runtime = "nodejs"

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export async function POST(request: Request) {
  let event: unknown
  try {
    event = JSON.parse(await request.text())
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 })
  }

  const verified = await verifyPaypalWebhook(request, event)
  if (!verified.ok) return Response.json({ error: verified.error }, { status: verified.status })

  const body = record(event)
  const eventType = typeof body?.event_type === "string" ? body.event_type : ""
  if (!isHandledPaypalEvent(eventType)) return Response.json({ received: true, ignored: true })

  try {
    await recordPaypalEvent(eventType, body?.resource)
  } catch (error) {
    const message = error instanceof Error ? error.message : "error"
    console.error("PayPal subscription store failed", eventType, message)
    if (message.includes("could not be read")) return Response.json({ error: "unparsed" }, { status: 400 })
    return Response.json({ error: "store_failed" }, { status: 500 })
  }

  return Response.json({ received: true })
}
