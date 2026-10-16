#!/usr/bin/env node
/**
 * Create the DigiMark101 Membership product and its three auto-renewing plans.
 *
 * Prices come from lib/paypal/membership.json. Run from the repo root:
 *   PAYPAL_ENV=sandbox PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... node scripts/paypal-create-plans.mjs
 *
 * The script also reads .env.local and .env when those variables are unset.
 * It prints the plan ids to paste into NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY,
 * NEXT_PUBLIC_PAYPAL_PLAN_QUARTERLY, and NEXT_PUBLIC_PAYPAL_PLAN_SEMIANNUAL.
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import membership from "../lib/paypal/membership.json" with { type: "json" }

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(".env.local")
loadEnvFile(".env")

const rawMode = (process.env.PAYPAL_ENV || "sandbox").trim().toLowerCase()
if (rawMode !== "sandbox" && rawMode !== "live") {
  console.error("PAYPAL_ENV must be sandbox or live.")
  process.exit(1)
}

const clientId = process.env.PAYPAL_CLIENT_ID?.trim()
const secret = process.env.PAYPAL_CLIENT_SECRET?.trim()
if (!clientId || !secret) {
  console.error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET. The public button id is not enough for this script.")
  process.exit(1)
}

const base = rawMode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

async function paypal(path, token, body) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error(`${path} failed (${response.status})`)
    console.error(JSON.stringify(json, null, 2))
    process.exit(1)
  }
  return json
}

const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials",
})
const tokenJson = await tokenResponse.json().catch(() => ({}))
if (!tokenResponse.ok || !tokenJson.access_token) {
  console.error(`PayPal token failed (${tokenResponse.status})`)
  console.error(JSON.stringify(tokenJson, null, 2))
  process.exit(1)
}

const product = await paypal("/v1/catalogs/products", tokenJson.access_token, {
  name: membership.productName,
  description: "Recurring DigiMark101 membership. Billed automatically in USD until cancelled.",
  type: "SERVICE",
  category: "SOFTWARE",
})

console.log(`PAYPAL_ENV=${rawMode}`)
console.log(`Product: ${product.id}`)

for (const plan of membership.plans) {
  const created = await paypal("/v1/billing/plans", tokenJson.access_token, {
    product_id: product.id,
    name: `${membership.productName} — ${plan.name}`,
    description: `${membership.currency} ${plan.amount} every ${plan.months} month(s). Auto-renews until cancelled.`,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "MONTH", interval_count: plan.months },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: { value: plan.amount, currency_code: membership.currency },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 3,
    },
  })
  console.log(`${plan.planEnv}=${created.id}`)
}

console.log("")
console.log("Paste those ids into the matching NEXT_PUBLIC_PAYPAL_PLAN_* variables.")
console.log("Use the same app's client id for NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_ID.")
console.log("Subscribe the webhook at /api/webhooks/paypal to:")
console.log("  BILLING.SUBSCRIPTION.ACTIVATED")
console.log("  BILLING.SUBSCRIPTION.CANCELLED")
console.log("  BILLING.SUBSCRIPTION.SUSPENDED")
console.log("  BILLING.SUBSCRIPTION.EXPIRED")
console.log("  PAYMENT.SALE.COMPLETED")
