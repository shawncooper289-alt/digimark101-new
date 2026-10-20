import { respondToAva } from "@shared/ava/respond"
import { NextResponse } from "next/server"
import { deskSnapshot } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"

const routes: { phrase: RegExp; href: string; label: string }[] = [
  { phrase: /\bplatform\b|main office|control cent(er|re)/, href: "/platform", label: "Main office" },
  { phrase: /\bcontent\b|\bsites?\b|\bpages?\b/, href: "/content", label: "Content" },
  { phrase: /\b(hub|products?)\b/, href: "/products", label: "Hub" },
  { phrase: /\bcampaigns?\b/, href: "/campaigns", label: "Campaigns" },
  { phrase: /\bleads?\b/, href: "/leads", label: "Leads" },
  { phrase: /\bcrm\b|\bcontacts?\b/, href: "/crm", label: "CRM" },
  { phrase: /\bpipeline\b|\bdeals?\b/, href: "/pipeline", label: "Pipeline" },
  { phrase: /\bautomations?\b/, href: "/automations", label: "Automations" },
  { phrase: /\b(invoices?|expenses?|records?|legal)\b/, href: "/records", label: "Records" },
  { phrase: /\bbilling\b|\bpaypal\b|\bsubscriptions?\b/, href: "/billing", label: "Billing" },
  { phrase: /\bclients?\b|\bworkspaces?\b/, href: "/clients", label: "Clients" },
  { phrase: /\breports?\b/, href: "/reports", label: "Reports" },
  { phrase: /\bcalendar\b|\bappointments?\b/, href: "/calendar", label: "Calendar" },
  { phrase: /\binbox\b|\bmessages?\b/, href: "/inbox", label: "Inbox" },
  { phrase: /\bmemory\b|\bremember\b/, href: "/memory", label: "Memory" },
  { phrase: /\bfiles?\b/, href: "/files", label: "Files" },
  { phrase: /\bsettings?\b/, href: "/settings", label: "Settings" },
  { phrase: /\btools?\b|\bbackends?\b/, href: "/tools", label: "Tools" },
  { phrase: /\btoday\b|\bdashboard\b|\bhome\b/, href: "/", label: "Today" },
]

const requests = new Map<string, { count: number; reset: number }>()

function draftContact(text: string) {
  const named = text.match(/(?:named|called)\s+([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+){0,2})/)
  if (!named && !/draft a contact|add a contact|new contact/.test(text.toLowerCase())) return null
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0]
  const company = text.match(/(?:at|company)\s+([A-Z][\w&'.-]+(?:\s+[A-Z][\w&'.-]+){0,2})/)?.[1]
  return { name: named?.[1] || "New contact", email, company }
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const now = Date.now()
  for (const [id, entry] of requests) if (entry.reset <= now) requests.delete(id)
  const entry = requests.get(owner.id) || { count: 0, reset: now + 60000 }
  entry.count += 1
  requests.set(owner.id, entry)
  if (entry.count > 30) return NextResponse.json({ error: "Too many messages. Try again in a minute." }, { status: 429 })
  const body = (await request.json().catch(() => null)) as { message?: string } | null
  const message = typeof body?.message === "string" ? body.message.trim() : ""
  if (!message || message.length > 1000) return NextResponse.json({ error: "Send a short question." }, { status: 400 })

  const draft = draftContact(message)
  if (draft) {
    return NextResponse.json({
      reply: `I drafted ${draft.name}. Confirm save and I will add the contact to the CRM. Nothing is stored yet.`,
      draft,
      href: "/crm",
    })
  }

  const route = routes.find((item) => item.phrase.test(message.toLowerCase()))
  if (route && /open|show|go|take me/.test(message.toLowerCase())) {
    return NextResponse.json({ reply: `Opening ${route.label}.`, href: route.href })
  }

  if (/how many|summary|status|what is on the desk/.test(message.toLowerCase())) {
    const snap = await deskSnapshot()
    const parts = [
      snap.premium === null ? "Lead counts are unavailable until Supabase is configured." : `${snap.premium} premium leads, ${snap.staging ?? 0} in staging, ${snap.rejected ?? 0} rejected.`,
      snap.contacts === null ? "" : `${snap.contacts} contacts, ${snap.deals ?? 0} deals, ${snap.automations ?? 0} automations on.`,
      snap.subscriptions === null ? "" : `${snap.subscriptions} PayPal subscriptions.`,
    ].filter(Boolean)
    return NextResponse.json({ reply: parts.join(" ") })
  }

  const answer = await respondToAva([{ role: "user", content: message }], {
    extra: "This is the private owner main office, not a customer enquiry. You are the same Ava Skye as DigiMark101, with a separate office wardrobe. Help manage the platform. You have not executed any tool in this response. Do not claim to read customer records, save, send, bill, or publish. Direct the owner to the appropriate office screen for confirmed changes. Office routes: /platform, /clients, /leads, /crm, /pipeline, /content, /campaigns, /automations, /billing, /records, /reports, /tools, /calendar, /inbox, /memory, /files, /settings. A guide-mode reply means the live provider is not connected or did not answer.",
  })
  return NextResponse.json({ reply: answer.text, live: answer.live, mode: answer.mode, notice: answer.notice, href: route?.href })
}
