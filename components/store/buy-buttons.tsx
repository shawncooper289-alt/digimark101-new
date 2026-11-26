"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

type PaypalButtons = {
  close: () => void
  render: (target: HTMLElement) => Promise<void>
}

type StorePaypal = {
  Buttons: (options: {
    style?: { shape?: string; color?: string; layout?: string; label?: string }
    createOrder: () => Promise<string>
    onApprove?: (data: { orderID?: string }) => Promise<void> | void
    onCancel?: () => void
    onError?: () => void
  }) => PaypalButtons
}

export function StoreBuyPanel({
  sku,
  sdkSrc,
  sandbox,
  disabledReason,
}: {
  sku: string
  sdkSrc: string | null
  sandbox: boolean
  disabledReason?: string
}) {
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const paypal = (window as unknown as { paypal?: StorePaypal }).paypal
    if (!ready || !sdkSrc || disabledReason || !paypal) return
    const target = document.getElementById(`store-buy-${sku}`)
    if (!target) return
    target.replaceChildren()
    let closed = false
    const buttons = paypal.Buttons({
      style: { shape: "pill", color: "gold", layout: "vertical", label: "pay" },
      createOrder: async () => {
        const response = await fetch("/api/store/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sku }),
        })
        const body = (await response.json()) as { paypalOrderId?: string; error?: string }
        if (!response.ok || !body.paypalOrderId) throw new Error(body.error || "Checkout did not start.")
        return body.paypalOrderId
      },
      onApprove: async (data) => {
        const response = await fetch("/api/store/orders/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: data.orderID || "" }),
        })
        const body = (await response.json()) as { confirmationPath?: string; error?: string }
        if (!response.ok || !body.confirmationPath?.startsWith("/store/confirmation")) {
          if (!closed) setMessage(body.error || "Payment did not finish.")
          return
        }
        window.location.assign(body.confirmationPath)
      },
      onCancel: () => {
        if (!closed) setMessage("Checkout cancelled. You were not charged.")
      },
      onError: () => {
        if (!closed) setMessage("PayPal did not finish. You can try the button again.")
      },
    })
    buttons.render(target).catch(() => {
      if (!closed) setMessage("PayPal did not load. Refresh the page and try again.")
    })
    return () => {
      closed = true
      try {
        buttons.close()
      } catch {
        // The button is already gone.
      }
    }
  }, [disabledReason, ready, sdkSrc, sku])

  return (
    <div className="mt-5">
      {sandbox && sdkSrc && !disabledReason ? (
        <p className="mb-3 text-sm font-semibold text-signal">Sandbox checkout. This button will not charge a live PayPal account.</p>
      ) : null}
      {sdkSrc && !disabledReason ? <Script src={sdkSrc} strategy="afterInteractive" onLoad={() => setReady(true)} onError={() => setMessage("PayPal did not load.")} /> : null}
      {sdkSrc && !disabledReason ? <div id={`store-buy-${sku}`} className="min-h-12" /> : null}
      {!sdkSrc ? (
        <p className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold" role="status">
          PayPal checkout needs the existing client id and secret. Plan settings are not used for this purchase.
        </p>
      ) : null}
      {disabledReason ? (
        <p className="rounded-2xl bg-mist px-4 py-3 text-sm font-semibold" role="status">
          {disabledReason}
        </p>
      ) : null}
      {message && message !== disabledReason ? (
        <p className="mt-3 text-sm text-signal" role="status">
          {message}
        </p>
      ) : null}
      <p className="mt-3 text-sm text-ink-soft">One-time payment. It does not start a membership and it does not change a PayPal plan.</p>
    </div>
  )
}
