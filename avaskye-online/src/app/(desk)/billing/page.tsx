import { GrantSeatForm } from "@/components/grant-seat-form"
import { deskRows, text } from "@/lib/desk"

export default async function BillingPage() {
  const rows = await deskRows("subscriptions", "select=id,status,plan_key,payer_email,amount_value,currency,last_payment_at,next_billing_time,paypal_subscription_id&order=updated_at.desc&limit=100")
  const seats = await deskRows("seats", "select=id,email,plan_key,status,source,invite_sent_at,paypal_subscription_id&order=updated_at.desc&limit=100")
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Billing</h1>
      <p className="mt-3 max-w-2xl text-muted">PayPal subscriptions written by the digimark101.com webhook, plus seats granted from this desk. Payer details stay here.</p>
      <GrantSeatForm />
      <h2 className="mt-10 text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Seats</h2>
      {seats.length === 0 ? <p className="mt-4 text-muted">No seats are stored yet. Apply the seats migration, then grant one or wait for PayPal.</p> : (
        <ul className="mt-4 grid gap-3">
          {seats.map((row) => (
            <li key={text(row, "id")} className="rounded-3xl border border-border bg-surface p-4">
              <p className="font-medium">{text(row, "email")} · {text(row, "plan_key")} · {text(row, "status")}</p>
              <p className="text-sm text-muted">{text(row, "source")} · invite {text(row, "invite_sent_at") || "not sent"} · PayPal {text(row, "paypal_subscription_id") || "none"}</p>
            </li>
          ))}
        </ul>
      )}
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
