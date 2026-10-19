import { NextResponse } from "next/server"
import { deskSnapshot } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"

const routes: { phrase: RegExp; href: string; label: string }[] = [
  { phrase: /\bleads?\b/, href: "/leads", label: "Leads" },
  { phrase: /\bcrm\b|\bcontacts?\b/, href: "/crm", label: "CRM" },
  { phrase: /\bpipeline\b|\bdeals?\b/, href: "/pipeline", label: "Pipeline" },
  { phrase: /\bautomations?\b/, href: "/automations", label: "Automations" },
  { phrase: /\bcampaigns?\b/, href: "/campaigns", label: "Campaigns" },
  { phrase: /\bniches?\b/, href: "/niches", label: "Niches" },
  { phrase: /\bclients?\b|\bworkspaces?\b/, href: "/clients", label: "Clients" },
  { phrase: /\breports?\b/, href: "/reports", label: "Reports" },
  { phrase: /\bsettings?\b/, href: "/settings", label: "Settings" },
  { phrase: /\btools?\b|\bbackends?\b/, href: "/tools", label: "Tools" },
  { phrase: /\btoday\b|\bdashboard\b|\bhome\b/, href: "/", label: "Today" },
]

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
  const body = (await request.json().catch(() => null)) as { message?: string } | null
  const message = body?.message?.trim() || ""
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

  return NextResponse.json({
    reply: route
      ? `${route.label} is on this desk. Say “open ${route.label.toLowerCase()}” and I will take you there.`
      : "I can open leads, CRM, pipeline, automations, campaigns, niches, clients, reports, tools, or settings. I can also draft a contact. I only cite counts that are in this workspace.",
    href: route?.href,
  })
}
