import { deskRows, text } from "@/lib/desk"

export default async function BillingPage() {
  const rows = await deskRows("subscriptions", "select=id,status,plan_key,payer_email,amount_value,currency,last_payment_at,next_billing_time,paypal_subscription_id&order=updated_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Billing</h1>
      <p className="mt-3 max-w-2xl text-muted">PayPal subscriptions written by the digimark101.com webhook. Payer details stay on this desk.</p>
      {rows.length === 0 ? <p className="mt-8 text-muted">No subscriptions are stored yet.</p> : (
        <ul className="mt-8 grid gap-3">
          {rows.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "plan_key") || "Plan"} · {text(row, "status")}</p>
              <p className="text-sm text-muted">{text(row, "payer_email") || "No payer email"} · {text(row, "amount_value")} {text(row, "currency")}</p>
              <p className="text-sm text-muted">Next bill {text(row, "next_billing_time") || "not set"} · PayPal {text(row, "paypal_subscription_id")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
