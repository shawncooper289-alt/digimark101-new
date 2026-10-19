import { paypalApiBase, paypalClientId, paypalClientSecret, paypalMode, type PaypalMode } from "@/lib/paypal/config"

function allowedCertUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") return false
    return (
      url.hostname === "api.paypal.com" ||
      url.hostname === "api.sandbox.paypal.com" ||
      url.hostname === "api-m.paypal.com" ||
      url.hostname === "api-m.sandbox.paypal.com"
    )
  } catch {
    return false
  }
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
  if (!response.ok) throw new Error(`PayPal token failed (${response.status})`)
  const json = (await response.json()) as { access_token?: string }
  if (!json.access_token) throw new Error("PayPal token missing")
  return json.access_token
}

export type VerifyResult = { ok: true } | { ok: false; status: number; error: string }

export async function verifyPaypalWebhook(request: Request, event: unknown): Promise<VerifyResult> {
  const mode = paypalMode()
  if (!mode.mode) return { ok: false, status: 500, error: "paypal_env" }

  const clientId = paypalClientId()
  const secret = paypalClientSecret()
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim()
  if (!clientId || !secret || !webhookId) return { ok: false, status: 503, error: "unconfigured" }

  const transmissionId = request.headers.get("paypal-transmission-id")
  const transmissionTime = request.headers.get("paypal-transmission-time")
  const transmissionSig = request.headers.get("paypal-transmission-sig")
  const authAlgo = request.headers.get("paypal-auth-algo")
  const certUrl = request.headers.get("paypal-cert-url")
  if (!transmissionId || !transmissionTime || !transmissionSig || !authAlgo || !certUrl) {
    return { ok: false, status: 400, error: "missing_headers" }
  }
  if (!allowedCertUrl(certUrl)) return { ok: false, status: 400, error: "cert_url" }

  try {
    const token = await accessToken(mode.mode, clientId, secret)
    const response = await fetch(`${paypalApiBase(mode.mode)}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: event,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return { ok: false, status: 502, error: "verify_failed" }
    const json = (await response.json()) as { verification_status?: string }
    if (json.verification_status !== "SUCCESS") return { ok: false, status: 400, error: "invalid_signature" }
    return { ok: true }
  } catch (error) {
    console.error("PayPal webhook verification failed", error instanceof Error ? error.message : "error")
    return { ok: false, status: 502, error: "verify_failed" }
  }
}
