import { NextResponse } from "next/server"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { saveLead } from "@/lib/leads"
import { services } from "@/lib/site"

export const runtime = "nodejs"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BUDGETS = new Set([
  "Not sure yet",
  "Under $5,000 / month",
  "$5,000–$10,000 / month",
  "$10,000–$20,000 / month",
  "$20,000+ / month",
])

function text(value: unknown, max: number) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  if (tooManyRequests(`lead:${clientIp(request)}`, 8)) {
    return NextResponse.json({ error: "Too many notes. Try again in a minute." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 })
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  if (text(record.company_website_confirm, 200)) {
    return NextResponse.json({ ok: true, persisted: true })
  }

  const name = text(record.name, 80)
  const email = text(record.email, 160)
  const message = text(record.message, 4000)
  const company = text(record.company, 120)
  const website = text(record.website, 200)
  const service = text(record.service, 40)
  const budget = text(record.budget, 80)

  if (name.length < 2) {
    return NextResponse.json({ error: "Add your name." }, { status: 400 })
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Add a valid email." }, { status: 400 })
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "Add a note of at least a sentence." }, { status: 400 })
  }
  if (service && service !== "not-sure" && !services.some((item) => item.slug === service)) {
    return NextResponse.json({ error: "Choose a service from the list." }, { status: 400 })
  }
  if (budget && !BUDGETS.has(budget)) {
    return NextResponse.json({ error: "Choose a budget range from the list." }, { status: 400 })
  }

  try {
    const result = await saveLead({
      name,
      email,
      company: company || null,
      website: website || null,
      service: service || null,
      budget: budget || null,
      message,
      source: "website",
    })

    if (!result.persisted && result.reason === "rejected") {
      return NextResponse.json(
        { error: "The note could not be stored. Email hello@digimark101.com and we will take it from there." },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, persisted: result.persisted })
  } catch (error) {
    console.error("Lead route failed", error instanceof Error ? error.name : "error")
    return NextResponse.json(
      { error: "The note could not be stored. Email hello@digimark101.com and we will take it from there." },
      { status: 502 },
    )
  }
}
