import { saleShouldKeepStatus, subscriptionPatch } from "@/lib/paypal/events"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

type ExistingSubscription = {
  owner_id: string | null
  status: string
  paypal_plan_id: string | null
  plan_key: string | null
  payer_email: string | null
  payer_id: string | null
  currency: string | null
  amount_value: number | null
  interval_count: number | null
  last_payment_amount: number | null
  last_payment_at: string | null
  next_billing_time: string | null
  activated_at: string | null
  cancelled_at: string | null
}

export async function recordPaypalEvent(eventType: string, resource: unknown) {
  const patch = subscriptionPatch(eventType, resource)
  if (!patch) throw new Error("PayPal event could not be read")
  const admin = createSupabaseAdmin()
  if (!admin) throw new Error("Supabase service role is not configured")

  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "owner_id, status, paypal_plan_id, plan_key, payer_email, payer_id, currency, amount_value, interval_count, last_payment_amount, last_payment_at, next_billing_time, activated_at, cancelled_at",
    )
    .eq("paypal_subscription_id", patch.paypal_subscription_id)
    .maybeSingle()

  if (error) throw new Error("Subscription lookup failed")
  const existing = (data as ExistingSubscription | null) ?? null
  const keepStatus = eventType === "PAYMENT.SALE.COMPLETED" && existing && saleShouldKeepStatus(existing.status)

  const row: Record<string, string | number | null> = {
    paypal_subscription_id: patch.paypal_subscription_id,
    status: keepStatus ? existing.status : patch.status,
    currency: patch.currency || existing?.currency || "USD",
    last_event_type: patch.last_event_type,
    updated_at: new Date().toISOString(),
  }

  const ownerId = patch.owner_id || existing?.owner_id
  if (ownerId) row.owner_id = ownerId

  assign(row, "paypal_plan_id", patch.paypal_plan_id, existing?.paypal_plan_id)
  assign(row, "plan_key", patch.plan_key, existing?.plan_key)
  assign(row, "payer_email", patch.payer_email, existing?.payer_email)
  assign(row, "payer_id", patch.payer_id, existing?.payer_id)
  assign(row, "amount_value", patch.amount_value, existing?.amount_value)
  assign(row, "interval_count", patch.interval_count, existing?.interval_count)
  assign(row, "last_payment_amount", patch.last_payment_amount, existing?.last_payment_amount)
  assign(row, "last_payment_at", patch.last_payment_at, existing?.last_payment_at)
  assign(row, "next_billing_time", patch.next_billing_time, existing?.next_billing_time)
  assign(row, "activated_at", patch.activated_at, existing?.activated_at)
  assign(row, "cancelled_at", patch.cancelled_at, existing?.cancelled_at)

  const { error: writeError } = await admin.from("subscriptions").upsert(row, { onConflict: "paypal_subscription_id" })
  if (writeError) throw new Error("Subscription upsert failed")
}

function assign(row: Record<string, string | number | null>, key: string, next: string | number | undefined, previous: string | number | null | undefined) {
  if (next !== undefined) row[key] = next
  else if (previous !== undefined && previous !== null) row[key] = previous
}
