import { cadenceLabel, compareLabel, formatUsd, listPlans, savingsPercent, type MembershipPlan } from "@/lib/paypal/plans"

export type PaypalMode = "sandbox" | "live"

export function paypalMode(): { mode: PaypalMode } | { mode: null } {
  const raw = process.env.PAYPAL_ENV
  if (raw === undefined || raw.trim() === "") return { mode: "sandbox" }
  const value = raw.trim().toLowerCase()
  if (value === "sandbox" || value === "live") return { mode: value }
  return { mode: null }
}

export function paypalApiBase(mode: PaypalMode) {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

export function paypalWebBase(mode: PaypalMode) {
  return mode === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com"
}

function firstEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return null
}

export function paypalClientId() {
  return firstEnv(["PAYPAL_CLIENT_ID", "NEXT_PUBLIC_PAYPAL_CLIENT_ID", "Client_ID"])
}

export function paypalClientSecret() {
  return firstEnv(["PAYPAL_CLIENT_SECRET", "PayPal"])
}

export function paypalSdkSrc(clientId: string, mode: PaypalMode) {
  const params = new URLSearchParams({
    "client-id": clientId,
    vault: "true",
    intent: "subscription",
    currency: "USD",
  })
  return `${paypalWebBase(mode)}/sdk/js?${params.toString()}`
}

export function planIdFromEnv(plan: MembershipPlan) {
  const value = process.env[plan.planEnv]?.trim()
  return value || null
}

export type MembershipOffer = {
  key: MembershipPlan["key"]
  name: string
  months: number
  amountLabel: string
  cadence: string
  savingsPercent: number
  compareLabel: string | null
  planId: string | null
}

export type MembershipOffers = {
  mode: PaypalMode | null
  sdkSrc: string | null
  login: "ok" | "rejected" | "missing"
  plans: MembershipOffer[]
}

export function membershipOffers(): MembershipOffers {
  const mode = paypalMode()
  const clientId = paypalClientId()
  const plans = listPlans().map((plan) => ({
    key: plan.key,
    name: plan.name,
    months: plan.months,
    amountLabel: formatUsd(plan.amount),
    cadence: cadenceLabel(plan.months),
    savingsPercent: savingsPercent(plan),
    compareLabel: compareLabel(plan),
    planId: planIdFromEnv(plan),
  }))
  const sdkSrc = clientId && mode.mode ? paypalSdkSrc(clientId, mode.mode) : null
  return { mode: mode.mode, sdkSrc, login: clientId && paypalClientSecret() ? "ok" : "missing", plans }
}
