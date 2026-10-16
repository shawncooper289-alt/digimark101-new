"use client"

import Script from "next/script"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { MembershipOffers } from "@/lib/paypal/config"
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

export function MembershipPicker({ offers }: { offers: MembershipOffers }) {
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
        One membership. Three ways to pay.
      </h2>
      <p className="mt-4 max-w-2xl text-ink-soft">
        DigiMark101 Membership renews automatically in USD until you cancel it in PayPal. The proposal packages above stay quoted. These prices are the membership, and they live in one config file so they can change later.
      </p>

      <div className="mt-8 inline-flex rounded-full border border-ink/10 bg-card p-1" role="radiogroup" aria-label="Billing term">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {offers.plans.map((plan) => {
          const active = plan.key === selected.key
          return (
            <article
              key={plan.key}
              className={`rounded-[1.5rem] border p-5 ${active ? "border-signal bg-mist" : "border-ink/10 bg-card"}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-3xl">{plan.name}</h3>
                {plan.savingsPercent > 0 ? (
                  <span className="stamp">About {plan.savingsPercent}% off</span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Base</span>
                )}
              </div>
              <p className="mt-3 text-2xl font-semibold">{plan.amountLabel}</p>
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
          Billed {selected.cadence}. {selected.savingsPercent > 0 ? `About ${selected.savingsPercent}% off the monthly rate.` : "This is the monthly base."}
        </p>
        {offers.mode === "sandbox" && checkoutReady ? (
          <p className="mt-3 text-sm font-semibold text-signal">Sandbox checkout. This button will not charge a live PayPal account.</p>
        ) : null}
        {authReady && userId ? (
          <p className="mt-3 text-sm text-ink-soft">You are signed in, so this membership will be linked to your studio account when PayPal confirms it.</p>
        ) : null}
        {authReady && !userId ? (
          <p className="mt-3 text-sm text-ink-soft">Sign in first if this membership should attach to your studio account. You can still subscribe as a guest.</p>
        ) : null}

        {checkoutReady && offers.sdkSrc ? (
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
          <p className="mt-5 rounded-2xl bg-mist px-4 py-3 text-sm font-semibold" role="status">
            {offers.mode === null
              ? "Membership checkout is coming soon. PAYPAL_ENV needs to be sandbox or live."
              : "Membership checkout is coming soon."}
          </p>
        )}
        <p className="mt-4 text-sm text-ink-soft">Cancel anytime in PayPal. Cancelling stops the next renewal. It does not start a project by itself.</p>
      </div>
    </section>
  )
}
