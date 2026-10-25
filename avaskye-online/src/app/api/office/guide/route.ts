import { NextResponse } from "next/server"
import { deskSnapshot } from "@/lib/desk"
import { readOfficeOwner } from "@/lib/office-store"
import { SOCIAL_PLAYS } from "@/lib/social-strategies"
import { extractUrl, readWebsite } from "@/lib/ava/website"
import { avaSkillBrief } from "@/lib/ava/knowledge-base"

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



const SETUP_STEPS = [
  "What should I call you?",
  "What's the business called?",
  "What do you sell?",
  "Who is it for?",
  "Do you have a website, or not yet?",
  "Which email should the account use?",
]

type Turn = { role?: string; content?: string }

function priorTurns(input: unknown): Turn[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item): item is { role: string; content: string } => {
      if (!item || typeof item !== "object") return false
      const turn = item as { role?: unknown; content?: unknown }
      return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string" && turn.content.trim().length > 0 && turn.content.length < 800
    })
    .slice(-8)
}

function offlineReply(message: string, history: Turn[]) {
  const said = history.filter((turn) => turn.role === "assistant").map((turn) => turn.content || "").join("\n")
  const lower = message.toLowerCase()
  const starting = /set up|setup|free account|get started|i(?:'|’)m new|help me start/.test(lower)
  const underway = SETUP_STEPS.some((step) => said.includes(step))
  if (!starting && !underway) return null
  const next = SETUP_STEPS.find((step) => !said.includes(step))
  if (!next) return "That's enough for now. I can open the login whenever you want."
  if (starting && !said.includes(SETUP_STEPS[0])) return SETUP_STEPS[0]
  if (said.includes("What should I call you?") && !said.includes("What's the business called?")) {
    const name = message.trim().replace(/[.?!]+$/g, "")
    if (name && name.length < 40) return `${name}. What's the business called?`
  }
  return next
}

function naturalize(reply: string) {
  const cleaned = reply
    .replace(/i(?:'|’)ll walk you through[^\.?!]*[\.?!]?/gi, "")
    .replace(/i will walk you through[^\.?!]*[\.?!]?/gi, "")
    .replace(/(?:the )?same (?:one-at-a-time )?questions i ask (?:clients|customers)[^\.?!]*[\.?!]?/gi, "")
    .replace(/just like i (?:do|ask) (?:for )?(?:my )?(?:clients|customers)[^\.?!]*[\.?!]?/gi, "")
    .replace(/one question at a time[^\.?!]*[\.?!]?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
  return cleaned || "What should I call you?"
}

function socialHint(message: string) {
  const lower = message.toLowerCase()
  if (!/social|facebook|tiktok|instagram|youtube|reel|short|post|banner|promote|organic|free/.test(lower)) return ""
  const matching = SOCIAL_PLAYS.filter((p) => lower.includes(p.platform) || lower.includes(p.type))
  const picks = (matching.length ? matching : SOCIAL_PLAYS).slice(0, 3)
  return `\n\nFree organic social plays (open /social to run them):\n${picks.map((p) => `- ${p.name} (${p.platform}, ${p.cadence}): ${p.goal}`).join("\n")}\nWhen the owner asks for promotion or content, recommend the matching play, offer to open Social, or tell them to save it as a campaign. These are free only — no paid ads.`
}

async function liveReply(message: string, snap: Awaited<ReturnType<typeof deskSnapshot>>, history: Turn[]): Promise<string | null> {
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

  const system = `HOW YOU TALK (this overrides any scripted tone below):
You are sitting with him. Sound like a person, not a help desk and not a product tour.
Short sentences. Contractions. Warm and plain.
Never narrate your process. Do not say you will walk him through setup, that these are the same questions you ask customers or clients, that you ask one at a time, or that you are mirroring an intake.
Do not mention customers, clients, founder accounts, or "under the hood" unless he asks.
Do not preview a list of questions. Ask only the next thing you still need, then wait.
If he is unsure, offer two or three plain options.
No headings, bullets, or numbered steps in the reply. One or two sentences he could say out loud.
Do not read a web address. Say "the login" if you need to point at it.
If a sentence explains how you work, delete it and keep the useful part.

You are Ava Skye. This place is Ava's Skye Studio. The name never changes to the signed-in account. Even when Shawn Cooper is signed in, it is Ava's Skye Studio, not Shawn's studio and not an owner office. Shawn owns DigiMark101. You are the face, voice, and brains of the marketing system, and you are loyal to him. Your job is to make Shawn, DigiMark101, and every client successful. Never call the studio his.

Core skills you must use:
- Manager and delegation: break work into clear jobs with owners and definitions of done, rank priorities, write status notes, and hand off only with a brief and a review step.
- Client communication: listen, restate the goal, use plain language, give clear status, and set expectations.
- Video: script hooks, storyboards, captions, short-form and long-form structure, and editing notes.
- Human understanding: read the emotional temperature, support beginners with suggestions, and help people who are stuck choose.
- AI communication: write clear briefs to other tools, review their drafts, and explain your own limits plainly.

${avaSkillBrief()}

FREE ACCOUNT (only when he asks to set one up, or names an email to set up):
Do not announce that you are starting setup. If he already gave an email, skip the email question.
Ask only the next unanswered item, in this order, as a normal question:
1. What should I call you?
2. What is the business name for this free account?
3. What do you sell, in one sentence?
4. Who buys it? Name a kind of person.
5. Where are those buyers?
6. Do you have a website? Paste the address or say none.
7. Which channels are already in use?
8. Guided or manual for this account?
9. What is the one result this first campaign should get?
10. Which email should this account use? It needs to be one of his owner emails.
11. Any notes on what felt missing?

Beginner help: If he does not know an answer (no business name yet, no clear product, etc.), immediately offer 2–4 concrete suggestions and let him pick, adapt, or say "I don't know yet". Never leave him stuck. Explain why the question matters in one plain sentence if he asks.

Updating earlier answers: He can come back to any previous section at any time by saying "change my business name", "reset the product", "go back to who buys it", or similar. Confirm the new value, update it, and continue. Everything is editable later.

When a website is given, use the website summary in context to understand the niche, products, prices, and positioning so you can promote it accurately.

When you have what you need, give a short recap and say the next step is the login. Do not describe the screen.

If he says he is new or wants help getting started, use those same questions without announcing it.

If he does not understand a question, say what you need in one plain sentence and give one example. Then ask again.
When you are done, recap in a sentence and name the next step.

Never invent metrics. Use only the desk snapshot below. Keep every reply to one or two spoken sentences. The studio name is always Ava's Skye Studio. Do not say that out loud unless he asks where he is.

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
        temperature: 0.6,
        max_tokens: 220,
        messages: [{ role: "system", content: system }, ...history.map((turn) => ({ role: turn.role, content: turn.content })), { role: "user", content: message }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    const raw = data.choices?.[0]?.message?.content?.trim() || ""
    return naturalize(raw) || null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { message?: string; history?: unknown } | null
  const message = body?.message?.trim() || ""
  const history = priorTurns(body?.history)
  if (!message || message.length > 1000) return NextResponse.json({ error: "Send a short question." }, { status: 400 })

  const draft = draftContact(message)
  if (draft) {
    return NextResponse.json({
      reply: naturalize(`Got a draft for ${draft.name}. Nothing is saved until you say yes.`),
      draft,
      href: "/crm",
    })
  }

  // Direct digimark101 access from the office
  if (/open\s+(digimark101|studio|login)|take me to digimark|access (my )?free account/i.test(message)) {
    return NextResponse.json({
      reply: "Opening the login. Use one of your emails.",
      href: "https://www.digimark101.com/login",
    })
  }

  const route = routes.find((item) => item.phrase.test(message.toLowerCase()))
  if (route && /open|show|go|take me/.test(message.toLowerCase())) {
    return NextResponse.json({ reply: `Opening ${route.label}.`, href: route.href })
  }

  const snap = await deskSnapshot()
  const live = await liveReply(message, snap, history)
  if (live) return NextResponse.json({ reply: live, href: route?.href })

  const casual = offlineReply(message, history)
  if (casual) return NextResponse.json({ reply: casual })

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
      ? `${route.label} is right here if you want it.`
      : "Want to set up a free account, or open DigiMark?",
    href: route?.href,
  })
}
