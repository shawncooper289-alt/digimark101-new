"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { MembershipOffers } from "@/lib/paypal/config"
import { RequestAccess } from "@/components/pricing/request-access"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

type PaypalButtons = {
  close: () => void
  render: (target: HTMLElement) => Promise<void>
}

type PaypalNamespace = {
  Buttons: (options: {
    style?: { shape?: string; color?: string; layout?: string; label?: string }
    createSubscription: (
      data: unknown,
      actions: { subscription: { create: (params: Record<string, unknown>) => Promise<string> } },
    ) => Promise<string>
    onApprove?: (data: { subscriptionID?: string }) => void
    onCancel?: () => void
    onError?: () => void
  }) => PaypalButtons
}

declare global {
  interface Window {
    paypal?: PaypalNamespace
  }
}

const includedToday = [
  "Studio, your workspace, saved to your login: contacts, pipeline, calendar, inbox notes, files, and media.",
  "Ava Skye, the AI assistant. She sets up your account with you by form or by conversation, fills the forms, and saves only after you say yes.",
  "Email lists and campaign drafts, funnel and page plans, and social post drafts, all kept in one place.",
  "Simple automations that log a note or save a memory when a contact, appointment, or deal changes.",
  "The first-campaign template: answer five questions and get one page, one lead form, and three emails to read and approve.",
  "Business setup, private memory for Ava, and reports that count your own records.",
]

const comingSoon = [
  "Sending email from Studio",
  "Posting straight to your social accounts",
  "Publishing pages and funnels online",
  "Business phone numbers, calling, and texting",
  "A white-label backend under your own name",
]

export function MembershipPicker({ offers, unrestricted = false }: { offers: MembershipOffers; unrestricted?: boolean }) {
  const router = useRouter()
  const [selectedKey, setSelectedKey] = useState(offers.plans[0]?.key ?? "monthly")
  const [sdkReady, setSdkReady] = useState(false)
  const [sdkError, setSdkError] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const selected = offers.plans.find((plan) => plan.key === selectedKey) ?? offers.plans[0]
  const checkoutReady = Boolean(offers.sdkSrc && offers.mode && selected?.planId)

  useEffect(() => {
    const supabase = createSupabaseBrowser()
    if (!supabase) return
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUserId(data.user?.id ?? null)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      setAuthReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!sdkReady || !selected?.planId || !window.paypal) return
    const target = document.getElementById("paypal-membership-button")
    if (!target) return
    target.replaceChildren()
    let closed = false
    const planId = selected.planId
    const buttons = window.paypal.Buttons({
      style: { shape: "pill", color: "gold", layout: "vertical", label: "subscribe" },
      createSubscription: (_data, actions) => {
        const params: Record<string, unknown> = {
          plan_id: planId,
          application_context: {
            brand_name: "DigiMark101",
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            return_url: `${window.location.origin}/thank-you`,
            cancel_url: `${window.location.origin}/cancel`,
          },
        }
        if (userId) params.custom_id = userId
        return actions.subscription.create(params)
      },
      onApprove: (data) => {
        const id = data.subscriptionID
        router.push(id ? `/thank-you?subscription_id=${encodeURIComponent(id)}` : "/thank-you")
      },
      onCancel: () => {
        router.push("/cancel")
      },
      onError: () => {
        if (!closed) setSdkError(true)
      },
    })
    buttons.render(target).catch(() => {
      if (!closed) setSdkError(true)
    })
    return () => {
      closed = true
      try {
        buttons.close()
      } catch {
        // The button instance is already gone when the plan changes quickly.
      }
      target.replaceChildren()
    }
  }, [router, sdkReady, selected?.planId, userId])

  if (!selected) return null

  return (
    <section className="mt-14 border-t border-ink/10 pt-10" aria-labelledby="membership-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Membership</p>
      <h2 id="membership-heading" className="mt-3 font-serif text-4xl md:text-5xl">
        One membership. A month-to-month starter, or three studio terms.
      </h2>
      <p className="mt-4 max-w-2xl text-ink-soft">
        DigiMark101 Membership renews automatically in USD until you cancel it in PayPal. Founding rates run through January 31, 2027, then the regular price applies to new checkouts. People who join before then stay on the rate they paid. Ad spend is not included. The proposal packages above stay quoted.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-ink/10 bg-card p-6">
          <h3 className="font-serif text-3xl">What members get today</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {includedToday.map((item) => (
              <li key={item} className="border-t border-ink/10 pt-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.5rem] border border-ink/10 bg-mist p-6">
          <h3 className="font-serif text-3xl">Coming soon</h3>
          <p className="mt-2 text-sm text-ink-soft">These are being built. They are not part of the membership yet.</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {comingSoon.map((item) => (
              <li key={item} className="border-t border-ink/10 pt-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-1 rounded-full border border-ink/10 bg-card p-1" role="radiogroup" aria-label="Billing term">
        {offers.plans.map((plan) => {
          const active = plan.key === selected.key
          return (
            <button
              key={plan.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelectedKey(plan.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-ink text-paper" : "text-ink-soft"}`}
            >
              {plan.name}
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {offers.plans.map((plan) => {
          const active = plan.key === selected.key
          return (
            <article
              key={plan.key}
              className={`rounded-[1.5rem] border p-5 ${active ? "border-signal bg-mist" : "border-ink/10 bg-card"}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-3xl">{plan.name}</h3>
                {plan.listLabel ? (
                  <span className="stamp">Founding</span>
                ) : plan.savingsPercent > 0 ? (
                  <span className="stamp">About {plan.savingsPercent}% off</span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Base</span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold">{plan.amountLabel}</p>
              {plan.listLabel ? <p className="text-sm text-ink-soft">Regular price {plan.listLabel}</p> : null}
              <p className="text-sm text-ink-soft">{plan.cadence}, auto-renewing</p>
              {plan.compareLabel ? <p className="mt-3 text-sm text-ink-soft">{plan.compareLabel}</p> : null}
              <button type="button" className="btn btn-signal mt-5" onClick={() => setSelectedKey(plan.key)} aria-pressed={active}>
                {active ? "Selected" : `Choose ${plan.name.toLowerCase()}`}
              </button>
            </article>
          )
        })}
      </div>

      <div className="mt-8 max-w-md rounded-[1.5rem] border border-ink/10 bg-card p-6">
        <h3 className="font-serif text-3xl">
          {selected.name} · {selected.amountLabel}
        </h3>
        <p className="mt-2 text-sm text-ink-soft">
          Billed {selected.cadence}. {selected.key === "starter" ? "Month to month. Cancel in PayPal before the next renewal." : selected.savingsPercent > 0 ? `About ${selected.savingsPercent}% off the monthly studio rate.` : "This is the monthly studio rate."} {selected.listLabel ? `Founding rate. New checkouts after January 31, 2027 pay ${selected.listLabel}.` : ""}
        </p>
        {unrestricted || !(offers.mode === "sandbox" && checkoutReady) ? null : (
          <p className="mt-3 text-sm font-semibold text-signal">Sandbox checkout. This button will not charge a live PayPal account.</p>
        )}
        {unrestricted ? null : authReady && userId ? (
          <p className="mt-3 text-sm text-ink-soft">You are signed in, so this membership will be linked to your studio account when PayPal confirms it.</p>
        ) : null}
        {unrestricted ? null : authReady && !userId ? (
          <p className="mt-3 text-sm text-ink-soft">Sign in first if this membership should attach to your studio account. You can still subscribe as a guest.</p>
        ) : null}

        {unrestricted ? (
          <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm font-semibold" role="status">
            Owner access is open. Seats, workspaces, and accounts are not limited, and this membership is not a billing gate.
          </p>
        ) : checkoutReady && offers.sdkSrc ? (
          <>
            <Script src={offers.sdkSrc} strategy="afterInteractive" onLoad={() => setSdkReady(true)} onError={() => setSdkError(true)} />
            <div id="paypal-membership-button" className="mt-5 min-h-12" />
            {sdkError ? (
              <p className="mt-3 text-sm text-ink-soft" role="status">
                PayPal did not load. Refresh the page, or request a proposal and we will send a payment link.
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm font-semibold" role="status">
              {offers.login === "rejected"
                ? "PayPal did not accept the saved login on live or sandbox. The Client ID and Secret need to be a matching pair from the same app."
                : offers.mode === null
                ? "PayPal checkout needs PAYPAL_ENV set to sandbox or live, plus a plan id."
                : "PayPal plan ids are not on this server yet, so the subscribe button is hidden."}
            </p>
            <RequestAccess planKey={selected.key} planName={selected.name} />
          </>
        )}
        <p className="mt-4 text-sm text-ink-soft">Cancel anytime in PayPal. Cancelling stops the next renewal. It does not start a project by itself.</p>
      </div>
    </section>
  )
}
