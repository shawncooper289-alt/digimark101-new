import { planIdFromEnv } from "@/lib/paypal/config"
import { listPlans } from "@/lib/paypal/plans"

export const PAYPAL_WEBHOOK_EVENTS = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "PAYMENT.SALE.COMPLETED",
] as const

export type PaypalWebhookEvent = (typeof PAYPAL_WEBHOOK_EVENTS)[number]

const HANDLED = new Set<string>(PAYPAL_WEBHOOK_EVENTS)

const STATUS_BY_EVENT: Record<string, string> = {
  "BILLING.SUBSCRIPTION.ACTIVATED": "ACTIVE",
  "BILLING.SUBSCRIPTION.CANCELLED": "CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED": "SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED": "EXPIRED",
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type SubscriptionPatch = {
  paypal_subscription_id: string
  owner_id?: string
  paypal_plan_id?: string
  plan_key?: string
  status: string
  payer_email?: string
  payer_id?: string
  currency: string
  amount_value?: number
  interval_count?: number
  last_payment_amount?: number
  last_payment_at?: string
  next_billing_time?: string
  activated_at?: string
  cancelled_at?: string
  last_event_type: string
}

export function isHandledPaypalEvent(eventType: string): eventType is PaypalWebhookEvent {
  return HANDLED.has(eventType)
}

export function ownerIdFromCustom(value: string | null) {
  if (!value || !UUID_RE.test(value)) return null
  return value.toLowerCase()
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function money(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function timestamp(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function amountOf(value: unknown) {
  const body = record(value)
  if (!body) return { amount: null, currency: null }
  const amount = money(body.value ?? body.total)
  const currency = text(body.currency_code ?? body.currency)
  return { amount, currency }
}

function planMatch(planId: string | null) {
  if (!planId) return null
  return listPlans().find((plan) => planIdFromEnv(plan) === planId) ?? null
}

export function subscriptionPatch(eventType: string, resource: unknown): SubscriptionPatch | null {
  if (!isHandledPaypalEvent(eventType)) return null
  const body = record(resource)
  if (!body) return null

  if (eventType === "PAYMENT.SALE.COMPLETED") {
    const subscriptionId = text(body.billing_agreement_id)
    if (!subscriptionId) return null
    const paid = amountOf(body.amount)
    const owner = ownerIdFromCustom(text(body.custom))
    const paidAt = timestamp(body.update_time) || timestamp(body.create_time)
    return {
      paypal_subscription_id: subscriptionId,
      ...(owner ? { owner_id: owner } : {}),
      status: "ACTIVE",
      currency: paid.currency || "USD",
      ...(paid.amount !== null ? { amount_value: paid.amount, last_payment_amount: paid.amount } : {}),
      ...(paidAt ? { last_payment_at: paidAt } : {}),
      last_event_type: eventType,
    }
  }

  const subscriptionId = text(body.id)
  if (!subscriptionId) return null
  const planId = text(body.plan_id)
  const matched = planMatch(planId)
  const subscriber = record(body.subscriber)
  const billing = record(body.billing_info)
  const lastPayment = record(billing?.last_payment)
  const paid = amountOf(lastPayment?.amount)
  const owner = ownerIdFromCustom(text(body.custom_id))
  const status = text(body.status) || STATUS_BY_EVENT[eventType]
  const when = timestamp(body.status_update_time) || timestamp(body.update_time)
  const payerEmail = text(subscriber?.email_address)
  const payerId = text(subscriber?.payer_id)
  const paidAt = timestamp(lastPayment?.time)
  const nextBilling = timestamp(billing?.next_billing_time)
  const recurring = matched ? Number(matched.amount) : paid.amount
  const amountValue = recurring !== null && Number.isFinite(recurring) ? recurring : null

  return {
    paypal_subscription_id: subscriptionId,
    ...(owner ? { owner_id: owner } : {}),
    ...(planId ? { paypal_plan_id: planId } : {}),
    ...(matched ? { plan_key: matched.key, interval_count: matched.months } : {}),
    status,
    ...(payerEmail ? { payer_email: payerEmail } : {}),
    ...(payerId ? { payer_id: payerId } : {}),
    currency: paid.currency || "USD",
    ...(amountValue !== null ? { amount_value: amountValue } : {}),
    ...(paid.amount !== null ? { last_payment_amount: paid.amount } : {}),
    ...(paidAt ? { last_payment_at: paidAt } : {}),
    ...(nextBilling ? { next_billing_time: nextBilling } : {}),
    ...(eventType === "BILLING.SUBSCRIPTION.ACTIVATED" && when ? { activated_at: when } : {}),
    ...((eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.EXPIRED") && when
      ? { cancelled_at: when }
      : {}),
    last_event_type: eventType,
  }
}

export function saleShouldKeepStatus(existingStatus: string | null) {
  return existingStatus === "CANCELLED" || existingStatus === "EXPIRED" || existingStatus === "SUSPENDED"
}
