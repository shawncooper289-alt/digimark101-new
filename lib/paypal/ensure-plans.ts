import { paypalApiBase, paypalClientId, paypalClientSecret, paypalMode, paypalSdkSrc, type MembershipOffers, type PaypalMode } from "@/lib/paypal/config"
import { listPlans, membershipCurrency, membershipProductName } from "@/lib/paypal/plans"

type PlanRef = { key: string; name: string; months: number; amount: string }

let ready: { mode: PaypalMode; ids: Record<string, string> } | null = null
let rejected = false

async function token(mode: PaypalMode, clientId: string, secret: string) {
  const response = await fetch(`${paypalApiBase(mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error("token")
  const json = (await response.json()) as { access_token?: string }
  if (!json.access_token) throw new Error("token")
  return json.access_token
}

async function paypal<T>(mode: PaypalMode, access: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${paypalApiBase(mode)}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error("paypal")
  return (await response.json()) as T
}

async function productId(mode: PaypalMode, access: string) {
  const listed = await paypal<{ products?: { id: string; name: string }[] }>(mode, access, "/v1/catalogs/products?page_size=20&page=1")
  const found = listed.products?.find((item) => item.name === membershipProductName)
  if (found) return found.id
  const created = await paypal<{ id: string }>(mode, access, "/v1/catalogs/products", {
    name: membershipProductName,
    description: "Recurring DigiMark101 membership. Billed automatically in USD until cancelled.",
    type: "SERVICE",
    category: "SOFTWARE",
  })
  return created.id
}

async function planId(mode: PaypalMode, access: string, product: string, plan: PlanRef) {
  const name = `${membershipProductName} — ${plan.name} ${plan.amount}`
  const listed = await paypal<{ plans?: { id: string; name: string }[] }>(
    mode,
    access,
    `/v1/billing/plans?product_id=${encodeURIComponent(product)}&page_size=20&page=1`,
  )
  const found = listed.plans?.find((item) => item.name === name)
  if (found) return found.id
  const created = await paypal<{ id: string }>(mode, access, "/v1/billing/plans", {
    product_id: product,
    name,
    description: `${membershipCurrency} ${plan.amount} every ${plan.months} month(s). Auto-renews until cancelled.`,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "MONTH", interval_count: plan.months },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: plan.amount, currency_code: membershipCurrency } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 3,
    },
  })
  return created.id
}

export async function offersWithPlans(offers: MembershipOffers): Promise<MembershipOffers> {
  if (offers.plans.every((plan) => plan.planId)) return offers
  if (!offers.sdkSrc || !offers.mode) return offers
  if (rejected) return { ...offers, sdkSrc: null, login: "rejected" }
  const clientId = paypalClientId()
  const secret = paypalClientSecret()
  if (!clientId || !secret) return offers
  const mode = paypalMode()
  if (!mode.mode) return offers
  try {
    if (!ready) {
      const preferred = mode.mode
      const order: PaypalMode[] = preferred === "sandbox" ? ["sandbox", "live"] : ["live", "sandbox"]
      let access = ""
      let used: PaypalMode | null = null
      for (const attempt of order) {
        try {
          access = await token(attempt, clientId, secret)
          used = attempt
          break
        } catch {
          access = ""
        }
      }
      if (!used) throw new Error("token")
      const product = await productId(used, access)
      const ids: Record<string, string> = {}
      for (const plan of listPlans()) ids[plan.key] = await planId(used, access, product, plan)
      ready = { mode: used, ids }
    }
    return {
      ...offers,
      mode: ready.mode,
      sdkSrc: paypalSdkSrc(clientId, ready.mode),
      login: "ok",
      plans: offers.plans.map((plan) => ({ ...plan, planId: plan.planId || ready?.ids[plan.key] || null })),
    }
  } catch {
    rejected = true
    return { ...offers, sdkSrc: null, login: "rejected" }
  }
}
