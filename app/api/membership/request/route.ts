import { NextResponse } from "next/server"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { ingestLead } from "@/lib/leads/engine"
import { listPlans } from "@/lib/paypal/plans"
import { deliverSeat } from "@/lib/seats/deliver"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`seat-request:${clientIp(request)}`, 6)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 })
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const record = body ?? {}
  if (text(record.company_website_confirm, 200)) return NextResponse.json({ ok: true })
  const name = text(record.name, 80)
  const email = text(record.email, 160).toLowerCase()
  const company = text(record.company, 120)
  const message = text(record.message, 2000)
  const planKey = text(record.plan, 40)
  const plans = new Set(listPlans().map((plan) => plan.key))
  if (record.consent_contact !== true) {
    return NextResponse.json({ error: "Consent to be contacted is required." }, { status: 400 })
  }
  if (name.length < 2) return NextResponse.json({ error: "Add your name." }, { status: 400 })
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Add a valid email." }, { status: 400 })
  if (!plans.has(planKey as "monthly")) return NextResponse.json({ error: "Choose a membership." }, { status: 400 })

  let stored = false
  try {
    const lead = await ingestLead({
      email,
      name,
      company,
      website: "",
      message: `Membership request (${planKey}). ${message || "Please open a studio seat."}`,
      service: "not-sure",
      region: "",
      companySize: "unspecified",
      source: "form",
      consentContact: true,
      consentShare: false,
    })
    stored = lead.stored
  } catch {
    stored = false
  }

  const seat = await deliverSeat({
    email,
    planKey,
    source: "request",
    sendInvite: false,
  })

  if (!stored && !seat.ok) {
    return NextResponse.json({ error: "The request could not be stored. Email hello@digimark101.com." }, { status: 502 })
  }
  return NextResponse.json({ ok: true, stored, seat: seat.ok })
}
