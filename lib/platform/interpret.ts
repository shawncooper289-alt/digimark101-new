import type { Action, AutomationAction, Stage, Trigger } from "@/lib/platform/types"
import { automationActions, stages, triggers } from "@/lib/platform/types"

export type Interpretation = {
  handled: boolean
  summary: string
  action?: Action
  fills?: Record<string, string>
  navigate?: string
}

const destinations: { href: string; words: string[] }[] = [
  { href: "/studio", words: ["today", "dashboard", "studio home"] },
  { href: "/studio/contacts", words: ["contacts", "contact", "people", "crm"] },
  { href: "/studio/pipeline", words: ["pipeline", "deals", "deal"] },
  { href: "/studio/calendar", words: ["calendar", "appointments", "appointment", "schedule"] },
  { href: "/studio/inbox", words: ["inbox", "messages", "conversations"] },
  { href: "/studio/campaigns", words: ["campaigns", "campaign"] },
  { href: "/studio/sites", words: ["sites", "site", "funnel", "funnels"] },
  { href: "/studio/automations", words: ["automations", "automation"] },
  { href: "/studio/reports", words: ["reports", "reporting", "report"] },
  { href: "/studio/files", words: ["files", "file", "storage"] },
  { href: "/studio/memory", words: ["memory", "memories"] },
  { href: "/contact", words: ["contact form", "the contact page"] },
  { href: "/pricing", words: ["pricing", "packages"] },
  { href: "/services", words: ["services"] },
]

function clean(value: string) {
  return value.replace(/\s+(email|e-mail|phone|company|from|at)\b.*$/i, "").replace(/[.,!?]+$/, "").trim()
}

function parseWhen(text: string): string | null {
  const iso = text.match(/\d{4}-\d{2}-\d{2}(?:[ t]\d{1,2}:\d{2})?/i)
  if (iso) {
    const value = new Date(iso[0].replace(" ", "T"))
    if (!Number.isNaN(value.getTime())) return value.toISOString()
  }
  if (!/tomorrow|today|next week/.test(text)) return null
  const date = new Date()
  if (/tomorrow/.test(text)) date.setDate(date.getDate() + 1)
  if (/next week/.test(text)) date.setDate(date.getDate() + 7)
  const clock = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
  let hours = clock ? Number(clock[1]) : 10
  const minutes = clock?.[2] ? Number(clock[2]) : 0
  const meridiem = clock?.[3]?.toLowerCase()
  if (meridiem === "pm" && hours < 12) hours += 12
  if (meridiem === "am" && hours === 12) hours = 0
  if (!meridiem && hours < 8) hours += 12
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function formFills(text: string, pageFields: string[]): Record<string, string> {
  if (pageFields.length === 0) return {}
  const fills: Record<string, string> = {}
  const allowed = new Set(pageFields)
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  if (email && allowed.has("email")) fills.email = email[0]
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)
  if (phone && allowed.has("phone")) fills.phone = phone[0].trim()
  const name = text.match(/(?:my name is|i am|i'm|this is|name is)\s+([a-z][a-z'’-]+(?:\s+[a-z][a-z'’-]+){0,2})/i)
  if (name && allowed.has("name")) fills.name = name[1].replace(/\b\w/g, (letter) => letter.toUpperCase())
  const company = text.match(/(?:company is|company called|company|we are|we're from|from)\s+([a-z0-9][a-z0-9 &'’.-]{1,60})/i)
  if (company && allowed.has("company")) fills.company = company[1].replace(/[.,!?]+$/, "").trim()
  const website = text.match(/https?:\/\/\S+/i)
  if (website && allowed.has("website")) fills.website = website[0]
  const message = text.match(/(?:message is|note is|we need|i need|looking for)\s+(.{8,400})/i)
  if (message && allowed.has("message")) fills.message = message[1].trim()
  const labeled = text.matchAll(/\b(name|email|company|website|phone|message|title|headline|brief)\s*(?:is|:)\s*([^,\n]+)/gi)
  for (const match of labeled) {
    const key = match[1].toLowerCase()
    if (allowed.has(key)) fills[key] = match[2].trim()
  }
  return fills
}

function stageOf(value: string): Stage | null {
  const found = stages.find((stage) => stage === value.toLowerCase())
  return found ?? null
}

export function interpret(text: string, pageFields: string[] = []): Interpretation {
  const raw = text.trim()
  const q = raw.toLowerCase()
  const fills = formFills(raw, pageFields)

  const go = q.match(/^(?:please\s+)?(?:go to|open|show me|take me to|navigate to)\s+(?:the\s+|my\s+)?(.+)$/)
  if (go) {
    const target = go[1].replace(/[?.!]+$/, "").trim()
    const destination = destinations.find((item) => item.words.some((word) => target === word || target.startsWith(word)))
    if (destination) {
      return { handled: true, summary: `Opening ${destination.href}.`, navigate: destination.href, fills: Object.keys(fills).length ? fills : undefined }
    }
  }

  if (/(?:^|\b)(remember|note that|keep in memory)\b/.test(q)) {
    const value = raw.replace(/^.*?\b(?:remember|note that|keep in memory)\b(?:\s+that)?\s*/i, "").trim()
    if (value.length > 1) {
      const key = value.split(/\s+/).slice(0, 4).join(" ").slice(0, 40)
      return { handled: true, summary: `I'll remember that for this client.`, action: { type: "remember", key, value: value.slice(0, 1000) }, fills: Object.keys(fills).length ? fills : undefined }
    }
  }

  const contact = raw.match(/(?:add|create|new)\s+(?:a\s+)?contact(?:\s+(?:named|called))?\s+([a-z][a-z .'’-]{1,80})/i)
  if (contact) {
    const email = raw.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    const company = raw.match(/(?:company|at|from)\s+([a-z0-9][a-z0-9 &'’.-]{1,60})/i)?.[1]
    return {
      handled: true,
      summary: "Adding that contact.",
      action: { type: "create_contact", name: clean(contact[1]), email, company: company?.replace(/[.,!?]+$/, "") },
      fills: Object.keys(fills).length ? fills : undefined,
      navigate: "/studio/contacts",
    }
  }

  const moved = raw.match(/move\s+(.+?)\s+to\s+(new|qualified|proposal|won|lost)\b/i)
  if (moved) {
    const stage = stageOf(moved[2])
    if (stage) return { handled: true, summary: "Moving that deal.", action: { type: "move_deal", title: moved[1].trim(), stage }, navigate: "/studio/pipeline" }
  }

  const deal = raw.match(/(?:add|create|new)\s+(?:a\s+)?deal(?:\s+(?:named|called))?\s+([^,\n]+)/i)
  if (deal) {
    return { handled: true, summary: "Adding that deal.", action: { type: "create_deal", title: clean(deal[1]), stage: "new" }, navigate: "/studio/pipeline" }
  }

  if (/(book|schedule)\s+(an?\s+)?(appointment|call|meeting)/i.test(raw)) {
    const startsAt = parseWhen(q)
    const withName = raw.match(/\bwith\s+([a-z][a-z .'’-]+?)(?:\s+on|\s+at|\s+tomorrow|\s+today|,|$)/i)
    const titled = raw.match(/\b(?:titled|called)\s+([^,\n]+)/i)
    if (!startsAt) {
      return { handled: true, summary: "Tell me when. For example: tomorrow at 10am, or 2026-10-20 15:00.", fills: Object.keys(fills).length ? fills : undefined }
    }
    return {
      handled: true,
      summary: "Booking that appointment.",
      action: { type: "book_appointment", title: titled?.[1]?.trim() || "Appointment", contactName: withName?.[1]?.trim(), startsAt },
      navigate: "/studio/calendar",
    }
  }

  const campaign = raw.match(/(?:start|create|new)\s+(?:a\s+)?campaign(?:\s+(?:named|called))?\s+([^,\n]+)/i)
  if (campaign) {
    const channel = /sms/.test(q) ? "sms" : /social/.test(q) ? "social" : /search|google|seo|ads/.test(q) ? "search" : "email"
    return {
      handled: true,
      summary: "Starting that campaign as a draft.",
      action: { type: "start_campaign", name: clean(campaign[1]), channel },
      navigate: "/studio/campaigns",
    }
  }

  const site = raw.match(/(?:create|add|new)\s+(?:a\s+)?(?:site|funnel)(?:\s+(?:named|called))?\s+([^,\n]+)/i)
  if (site) {
    return { handled: true, summary: "Registering that site as a draft.", action: { type: "create_site", name: clean(site[1]) }, navigate: "/studio/sites" }
  }

  if (/create (?:an )?automation/.test(q)) {
    const trigger: Trigger = /appointment/.test(q) ? "appointment.booked" : /deal/.test(q) ? "deal.moved" : "contact.created"
    const actionName: AutomationAction = /remember/.test(q) ? "remember" : "log_inbox"
    if (!triggers.includes(trigger) || !automationActions.includes(actionName)) {
      return { handled: false, summary: "" }
    }
    return {
      handled: true,
      summary: "Creating that automation.",
      action: { type: "create_automation", name: "Studio automation", trigger, action: actionName },
      navigate: "/studio/automations",
    }
  }

  const note = raw.match(/(?:log|leave)\s+(?:a\s+)?(?:note|message)(?:\s+for\s+([^:]+))?\s*:\s*(.+)/i)
  if (note) {
    return {
      handled: true,
      summary: "Logging that note.",
      action: { type: "log_message", contactName: note[1]?.trim() || "Workspace", body: note[2].trim() },
      navigate: "/studio/inbox",
    }
  }

  if (Object.keys(fills).length > 0) {
    return { handled: true, summary: "I filled the fields I could hear. Check them before you send.", fills }
  }

  return { handled: false, summary: "" }
}
