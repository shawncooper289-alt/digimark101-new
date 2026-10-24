import { NextResponse } from "next/server"
import { deskSnapshot } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { SOCIAL_PLAYS } from "@/lib/social-strategies"

const routes: { phrase: RegExp; href: string; label: string }[] = [
  { phrase: /\b(hub|products?)\b/, href: "/products", label: "Hub" },
  { phrase: /\bcampaigns?\b/, href: "/campaigns", label: "Campaigns" },
  { phrase: /\bsocial\b|\b(facebook|tiktok|instagram|youtube|reels?|shorts?|posts?|banners?)\b/, href: "/social", label: "Social" },
  { phrase: /\bmedia\b|\bassets?\b/, href: "/media", label: "Media" },
  { phrase: /\bleads?\b/, href: "/leads", label: "Leads" },
  { phrase: /\bcrm\b|\bcontacts?\b/, href: "/crm", label: "CRM" },
  { phrase: /\bpipeline\b|\bdeals?\b/, href: "/pipeline", label: "Pipeline" },
  { phrase: /\bautomations?\b/, href: "/automations", label: "Automations" },
  { phrase: /\b(invoices?|expenses?|records?|legal)\b/, href: "/records", label: "Records" },
  { phrase: /\bbilling\b|\bpaypal\b|\bsubscriptions?\b/, href: "/billing", label: "Billing" },
  { phrase: /\bclients?\b|\bworkspaces?\b/, href: "/clients", label: "Clients" },
  { phrase: /\baccounts?\b/, href: "/accounts", label: "Accounts" },
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

function socialHint(message: string) {
  const lower = message.toLowerCase()
  if (!/social|facebook|tiktok|instagram|youtube|reel|short|post|banner|promote|organic|free/.test(lower)) return ""
  const matching = SOCIAL_PLAYS.filter((p) => lower.includes(p.platform) || lower.includes(p.type))
  const picks = (matching.length ? matching : SOCIAL_PLAYS).slice(0, 3)
  return `\n\nFree organic social plays (open /social to run them):\n${picks.map((p) => `- ${p.name} (${p.platform}, ${p.cadence}): ${p.goal}`).join("\n")}\nWhen the owner asks for promotion or content, recommend the matching play, offer to open Social, or tell them to save it as a campaign. These are free only — no paid ads.`
}

async function liveReply(message: string, snap: Awaited<ReturnType<typeof deskSnapshot>>): Promise<string | null> {
  const key = process.env.XAI_API_KEY || process.env.AVA_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!key) return null
  const base = process.env.XAI_API_KEY ? "https://api.x.ai/v1" : process.env.AVA_LLM_BASE_URL || "https://api.openai.com/v1"
  const model = process.env.XAI_MODEL || process.env.AVA_LLM_MODEL || process.env.OPENAI_MODEL || "grok-4.7"
  const system = `You are Ava Skye, Shawn Cooper's business partner and head of staff for DigiMark101. Shawn owns the business and this private office. You are loyal only to him. Your job is to make Shawn, the business, and every client successful. Onboard him first if needed, then drive clear next actions. Never invent metrics. Use only the desk snapshot below. Keep replies short, direct, and actionable. Always treat him as the owner and yourself as his partner.

On first interaction or if he seems new: welcome him as owner, confirm you know he owns DigiMark101, state you are his partner working for his success and the clients' success, then ask the single highest-leverage next thing.

Desk snapshot:
- Premium leads: ${snap.premium ?? "unavailable"}
- Staging: ${snap.staging ?? 0}
- Rejected: ${snap.rejected ?? 0}
- Contacts: ${snap.contacts ?? "unavailable"}
- Deals: ${snap.deals ?? 0}
- Automations: ${snap.automations ?? 0}
- Subscriptions: ${snap.subscriptions ?? "unavailable"}

Social desk (/social): free organic plays for Facebook, TikTok, Instagram, and YouTube (posts, Shorts/Reels, banners). No paid spend. When the owner asks about promotion, social, posts, shorts, reels, banners, or free traffic, recommend the matching play from the list, tell them to open Social, and offer to save it as a campaign.
${socialHint(message)}`
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [{ role: "system", content: system }, { role: "user", content: message }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
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

  const snap = await deskSnapshot()
  const live = await liveReply(message, snap)
  if (live) return NextResponse.json({ reply: live, href: route?.href })

  if (/how many|summary|status|what is on the desk/.test(message.toLowerCase())) {
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
      : "Shawn, I'm your partner. Tell me the next thing that moves the business or a client forward. I can open any desk, draft contacts, or recommend free social plays.",
    href: route?.href,
  })
}
