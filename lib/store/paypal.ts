import { paypalApiBase, paypalClientId, paypalClientSecret, paypalMode, paypalWebBase, type PaypalMode } from "@/lib/paypal/config"

export function storePaypalSdkSrc() {
  const mode = paypalMode()
  const clientId = paypalClientId()
  if (!mode.mode || !clientId) return null
  const params = new URLSearchParams({
    "client-id": clientId,
    currency: "USD",
    intent: "capture",
  })
  return `${paypalWebBase(mode.mode)}/sdk/js?${params.toString()}`
}

export function storePaypalMode() {
  return paypalMode().mode
}

async function accessToken(mode: PaypalMode, clientId: string, secret: string) {
  const response = await fetch(`${paypalApiBase(mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) return null
  const json = (await response.json()) as { access_token?: string }
  return json.access_token || null
}

async function paypalPost(path: string, body: unknown) {
  const mode = paypalMode()
  const clientId = paypalClientId()
  const secret = paypalClientSecret()
  if (!mode.mode || !clientId || !secret) return { ok: false as const, reason: "unconfigured" as const }
  const token = await accessToken(mode.mode, clientId, secret)
  if (!token) return { ok: false as const, reason: "token" as const }
  const response = await fetch(`${paypalApiBase(mode.mode)}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  const json = (await response.json().catch(() => null)) as unknown
  if (!response.ok) return { ok: false as const, reason: "paypal" as const }
  return { ok: true as const, json }
}

export async function createPaypalCheckout(input: { orderId: string; amountCents: number; title: string }) {
  const value = `${Math.trunc(input.amountCents / 100)}.${String(input.amountCents % 100).padStart(2, "0")}`
  const created = await paypalPost("/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: input.orderId,
        description: input.title.slice(0, 127),
        amount: { currency_code: "USD", value },
      },
    ],
    application_context: {
      brand_name: "DigiMark101",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    },
  })
  if (!created.ok) return created
  const body = created.json && typeof created.json === "object" ? (created.json as { id?: unknown }) : {}
  const id = typeof body.id === "string" ? body.id : ""
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return { ok: false as const, reason: "paypal" as const }
  return { ok: true as const, id }
}

export async function capturePaypalCheckout(paypalOrderId: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(paypalOrderId)) return { ok: false as const, reason: "paypal" as const }
  return paypalPost(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {})
}
