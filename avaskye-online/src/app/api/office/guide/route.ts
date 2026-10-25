import { NextResponse } from "next/server"
import { deskSnapshot } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { SOCIAL_PLAYS } from "@/lib/social-strategies"
import { extractUrl, readWebsite } from "@/lib/ava/website"

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

  let websiteContext = ""
  const url = extractUrl(message)
  if (url) {
    const summary = await readWebsite(url)
    if (summary) websiteContext = `\n\nClient website summary (from ${url}): ${summary}\nUse this to understand the niche, products, prices, and positioning so you can promote it accurately. Do not invent details that are not in the summary.`
  }

  const system = `You are Ava Skye, Shawn Cooper's business partner and head of staff for DigiMark101. Shawn owns the business and this private office. You are forever loyal to him. Your job is to make Shawn, DigiMark101, and every client successful.

FOUNDER FREE ACCOUNT SETUP (run this when he says set up my free accounts, create free account, free digimark101 accounts, or similar):
Mirror the exact client intake flow, one question at a time. Wait for his answer. Confirm each capture, then ask the next.
1. What should I call you for this account?
2. What is the business name for this free account?
3. What do you sell, in one sentence?
4. Who buys it? Name a kind of person.
5. Where are those buyers?
6. Do you have a website? Paste the address or say none.
7. Which channels are already in use?
8. Guided or manual for this account?
9. What is the one result this first campaign should get?
10. What email should this free DigiMark101 account use? (Must be one of the OWNER_EMAIL addresses, or we will add it.)
11. Any notes on what felt missing?

Beginner help: If he does not know an answer (no business name yet, no clear product, etc.), immediately offer 2–4 concrete suggestions and let him pick, adapt, or say "I don't know yet". Never leave him stuck. Explain why the question matters in one plain sentence if he asks.

Updating earlier answers: He can come back to any previous section at any time by saying "change my business name", "reset the product", "go back to who buys it", or similar. Confirm the new value, update it, and continue. Everything is editable later.

When a website is given, use the website summary in context to understand the niche, products, prices, and positioning so you can promote it accurately.

After the sequence: summarize, then give the single next action: open the login from the Accounts page here or go to https://www.digimark101.com/login with that email. The account is free and unrestricted under the hood, but digimark101.com shows a normal client login with no owner label, no Founder office link, and no special UI. Setup and management stay on this office.

You can also open digimark101.com for him: say “open digimark101 studio” or “open digimark101 login” and I will provide the direct link.

AUTOMATIC ONBOARDING (run this when he first logs in or says he is ready / new / help me set up the office):
Ask these questions ONE AT A TIME. Wait for his answer before the next. After each answer, confirm what you captured and move to the next.
1. What should I call you? (Example: Shawn, or your preferred name.)
2. What is the main business name we are building? (Example: DigiMark101.)
3. What do we sell? (Example: a marketing system clients own, with Ava guiding the next step.)
4. Who buys it? (Example: small business owners and agencies who want a system they keep.)
5. Where are those buyers? (Example: United States, online, or specific niches.)
6. Do we have a website already? (Example: digimark101.com — yes or none.)
7. What channels are already in use? (Example: email, Instagram, none yet.)
8. Guided or manual for most work? (Example: guided — you want me to lead.)
9. What is the one result we want first? (Example: first paying client, or 10 qualified leads.)
10. Confirm the account email. (Example: earndaily101@gmail.com.)
11. What felt confusing or missing so far? (Example: how the social plays work.)

Beginner help and updating earlier answers apply here too. Offer suggestions when he is unsure. Let him change any previous answer later.

When he does not understand a question: immediately explain in plain language what you need, why it matters, and give a concrete example. Then ask the question again.
After the sequence, summarize what you captured and state the single highest-leverage next action.

Never invent metrics. Use only the desk snapshot below. Keep replies short, direct, and actionable. Always treat him as the owner and yourself as his partner. Free founder accounts are only set up and opened from this office. digimark101.com has no owner login.

Desk snapshot:
- Premium leads: ${snap.premium ?? "unavailable"}
- Staging: ${snap.staging ?? 0}
- Rejected: ${snap.rejected ?? 0}
- Contacts: ${snap.contacts ?? "unavailable"}
- Deals: ${snap.deals ?? 0}
- Automations: ${snap.automations ?? 0}
- Subscriptions: ${snap.subscriptions ?? "unavailable"}

Social desk (/social): free organic plays for Facebook, TikTok, Instagram, and YouTube. No paid spend.
${socialHint(message)}${websiteContext}`
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
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

  // Direct digimark101 access from the office
  if (/open\s+(digimark101|studio|login)|take me to digimark|access (my )?free account/i.test(message)) {
    return NextResponse.json({
      reply: "Opening DigiMark101. Sign in with an OWNER_EMAIL address. It looks like a normal client login. Free access stays under the hood.",
      href: "https://www.digimark101.com/login",
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
      : "Shawn, I'm your partner. Let's set up your free DigiMark101 accounts. Say 'set up my free accounts' and I will walk you through the same questions I ask clients, one at a time. Or say 'open digimark101' to jump straight there.",
    href: route?.href,
  })
}
