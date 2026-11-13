import { BANNED_LINE_RULE, omitBannedLine } from "@/lib/ava/banned-line"
import type { Action, AutomationAction, SocialPlatform, Stage, Trigger } from "@/lib/platform/types"
import { automationActions, socialPlatforms, stages, triggers } from "@/lib/platform/types"

/** Hard cap. A seventh job waits until one of these finishes. */
export const MAX_CONCURRENT_SPECIALISTS = 6

export const SPECIALIST_ROLES = [
  {
    id: "copywriter",
    title: "Copywriter",
    scope: "Writes pages, offers, captions, and email drafts. Does not publish or send.",
    tools: ["start_campaign", "draft_social_post", "create_site", "remember"],
  },
  {
    id: "social",
    title: "Social scheduler",
    scope: "Drafts posts and dates for Facebook, Instagram, LinkedIn, X, TikTok, YouTube, and Google Business Profile. Does not publish.",
    tools: ["draft_social_post"],
  },
  {
    id: "ads",
    title: "Ads analyst",
    scope: "Drafts an ad note from numbers the person already gave. Does not open an ad account or spend.",
    tools: ["start_campaign", "remember"],
  },
  {
    id: "seo",
    title: "Website helper",
    scope: "Drafts page outlines and search-friendly headings. Does not publish a site.",
    tools: ["create_site", "remember"],
  },
  {
    id: "followup",
    title: "Follow-up helper",
    scope: "Drafts customer-list notes, email drafts, and in-workspace reminders. Does not email or text anyone.",
    tools: ["log_message", "draft_email_list", "create_automation", "create_contact", "remember"],
  },
  {
    id: "research",
    title: "Research helper",
    scope: "Summarizes only the facts in the brief. Does not invent traffic, revenue, or reviews.",
    tools: ["log_message", "remember"],
  },
] as const

export type SpecialistRoleId = (typeof SPECIALIST_ROLES)[number]["id"]

const ROLE_IDS = SPECIALIST_ROLES.map((role) => role.id)

export function isSpecialistRole(value: string): value is SpecialistRoleId {
  return (ROLE_IDS as readonly string[]).includes(value)
}

export function specialistRole(id: string) {
  return SPECIALIST_ROLES.find((role) => role.id === id) ?? null
}

const SHARED_RULES = `${BANNED_LINE_RULE}
The name Ava is pronounced AY-vuh. You are an internal helper. Do not mention that you are a separate bot.
Do not invent clients, testimonials, revenue, ad results, or traffic numbers.
Do not email, text, call, publish, or spend money. Consent is required before any outreach, and you cannot send it.
Do not include a private email address or phone number in a draft that would be posted in public.
If a fact is missing, say what you need. Write in plain American English.`

const TOOL_DEFS: Record<string, { description: string; parameters: Record<string, unknown> }> = {
  start_campaign: {
    description: "Draft a campaign. This does not send it.",
    parameters: { type: "object", properties: { name: { type: "string" }, channel: { type: "string" }, brief: { type: "string" } }, required: ["name"] },
  },
  draft_social_post: {
    description: "Draft a social post. This does not publish it.",
    parameters: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "google"] },
        body: { type: "string" },
        scheduledFor: { type: "string" },
      },
      required: ["platform", "body"],
    },
  },
  create_site: {
    description: "Draft a page record. This does not publish it.",
    parameters: { type: "object", properties: { name: { type: "string" }, headline: { type: "string" } }, required: ["name"] },
  },
  remember: {
    description: "Suggest a memory. It is not saved until the person confirms.",
    parameters: { type: "object", properties: { key: { type: "string" }, value: { type: "string" } }, required: ["key", "value"] },
  },
  log_message: {
    description: "Suggest an inbox note. It is not saved until the person confirms.",
    parameters: { type: "object", properties: { contactName: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["body"] },
  },
  draft_email_list: {
    description: "Suggest an email list name. This does not send email.",
    parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  create_contact: {
    description: "Suggest a contact. It is not saved until the person confirms.",
    parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, company: { type: "string" } }, required: ["name"] },
  },
  create_automation: {
    description: "Suggest an in-workspace rule that only logs a note or a memory.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        trigger: { type: "string", enum: ["contact.created", "appointment.booked", "deal.moved"] },
        action: { type: "string", enum: ["log_inbox", "remember"] },
      },
      required: ["trigger", "action"],
    },
  },
}

export function specialistTools(roleId: SpecialistRoleId) {
  const role = specialistRole(roleId)
  if (!role) return []
  return role.tools
    .filter((name) => TOOL_DEFS[name])
    .map((name) => ({ type: "function", function: { name, description: TOOL_DEFS[name].description, parameters: TOOL_DEFS[name].parameters } }))
}

export function specialistSystemPrompt(roleId: SpecialistRoleId) {
  const role = specialistRole(roleId)
  if (!role) return SHARED_RULES
  return `You help Ava Skye inside DigiMark101. Your job: ${role.scope}
You may only suggest these workspace drafts: ${role.tools.join(", ")}. Anything else is out of scope.
${SHARED_RULES}`
}

export type SpecialistJob = { role: SpecialistRoleId; brief: string }

export function normalizeJobs(input: unknown, limit = 12): SpecialistJob[] {
  if (!Array.isArray(input)) return []
  const jobs: SpecialistJob[] = []
  for (const item of input) {
    if (jobs.length >= limit) break
    if (!item || typeof item !== "object") continue
    const role = "role" in item && typeof item.role === "string" ? item.role : ""
    const brief = "brief" in item && typeof item.brief === "string" ? item.brief.trim().slice(0, 2000) : ""
    if (!isSpecialistRole(role) || brief.length < 2) continue
    jobs.push({ role, brief })
  }
  return jobs
}

/** Plain-language requests that should be handed to a helper even when no live model is on. */
export function jobsFromRequest(text: string): SpecialistJob[] {
  const q = text.toLowerCase()
  const asks = /\b(draft|write|plan|outline|make|build|prepare|schedule)\b/.test(q)
    || /\b(content calendar|week of posts|welcome sequence|follow-?up email|ad brief)\b/.test(q)
  if (!asks) return []
  const jobs: SpecialistJob[] = []
  const add = (role: SpecialistRoleId, brief: string) => {
    if (jobs.some((job) => job.role === role)) return
    jobs.push({ role, brief })
  }
  if (/\b(caption|social post|content calendar|week of posts|posting plan)\b/.test(q)) add("social", text.slice(0, 2000))
  if (/\b(ad brief|ads?\b|campaign analysis|roas|google ads|meta ads)\b/.test(q)) add("ads", text.slice(0, 2000))
  if (/\b(seo|search ranking|homepage outline|website outline|meta description)\b/.test(q)) add("seo", text.slice(0, 2000))
  if (/\b(follow-?up email|welcome sequence|email sequence|crm note|customer list)\b/.test(q)) add("followup", text.slice(0, 2000))
  if (/\b(research|weekly report|competitor notes|what changed)\b/.test(q)) add("research", text.slice(0, 2000))
  if (/\b(write the copy|sales page|homepage copy|offer copy|landing page copy)\b/.test(q)) add("copywriter", text.slice(0, 2000))
  return jobs.slice(0, 12)
}

export function localSpecialistDraft(roleId: SpecialistRoleId, brief: string) {
  const topic = brief.replace(/\s+/g, " ").trim().slice(0, 400)
  const drafts: Record<SpecialistRoleId, string> = {
    copywriter: `Starter draft\n\nWorking title: ${topic}\n\nOpening: Say who it is for and what they can do next, in one sentence.\nBody: Three short points they can check. Leave proof blank until they give you a real example.\nClose: One next step. Do not invent a review or a number.\n\nThis is a draft to edit. Nothing has been published or sent.`,
    social: `Starter post plan\n\n1. A short post about: ${topic}\n2. The same idea, told as a question.\n3. A reminder of the next step, with the date left blank for them to fill in.\n\nThese are drafts. They are not scheduled on a social network.`,
    ads: `Starter ad note\n\nOffer: ${topic}\nWhat we will not do: spend money, open an ad account, or guess a result.\nNext step: write one sentence on who it is for, then decide a budget in writing before any ad exists.\n\nNo performance number is included because none was provided.`,
    seo: `Starter page outline\n\nPage idea: ${topic}\nHeading: the offer in plain words.\nSections: who it is for, what is included, what it costs if they already said, and how to start.\nSearch note: use the words a customer would type. Do not promise a ranking.\n\nThis outline is not a published page.`,
    followup: `Starter follow-up\n\nNote to keep: ${topic}\nA first email draft can say hello, restate what they asked, and offer one next step.\nDo not send it. Do not text them. Outreach waits until they have agreed to hear from you.\n\nNothing was emailed.`,
    research: `Starter notes\n\nWhat was asked: ${topic}\nWhat I can say: only what is written in that request.\nWhat I will not add: traffic, revenue, reviews, or a ranking.\nNext step: paste the real numbers or the page address if you want a tighter note.\n\nThis is not a live report.`,
  }
  return omitBannedLine(drafts[roleId])
}

const INTERNAL_WORDS = [
  "copywriter",
  "social scheduler",
  "ads analyst",
  "website helper",
  "follow-up helper",
  "research helper",
  "specialist bot",
  "internal bot",
  "hidden bot",
]

/** Client-facing text. Ava speaks. The helper's name stays out. */
export function presentAsAva(parts: string[]) {
  let text = parts.map((part) => part.trim()).filter(Boolean).join("\n\n")
  for (const word of INTERNAL_WORDS) {
    const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    text = text.replace(pattern, "")
  }
  text = text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  const intro = "Here is a draft from me. Nothing has been sent, posted, or charged."
  if (!text) return omitBannedLine(intro)
  return omitBannedLine(`${intro}\n\n${text}`)
}

type ToolCall = { name?: string; arguments?: unknown }

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function actionsFromCalls(roleId: SpecialistRoleId, calls: ToolCall[]): Action[] {
  const allowed = new Set<string>(specialistRole(roleId)?.tools ?? [])
  const actions: Action[] = []
  for (const call of calls) {
    if (!call?.name || !allowed.has(call.name)) continue
    const args = call.arguments && typeof call.arguments === "object" ? (call.arguments as Record<string, unknown>) : {}
    const action = oneAction(call.name, args)
    if (action) actions.push(action)
  }
  return actions
}

function oneAction(name: string, args: Record<string, unknown>): Action | null {
  if (name === "start_campaign" && str(args.name)) {
    return { type: "start_campaign", name: str(args.name).slice(0, 120), channel: str(args.channel).slice(0, 40) || undefined, brief: str(args.brief).slice(0, 1000) || undefined }
  }
  if (name === "draft_social_post" && str(args.body) && socialPlatforms.includes(str(args.platform) as SocialPlatform)) {
    return { type: "draft_social_post", platform: str(args.platform) as SocialPlatform, body: str(args.body).slice(0, 2000), scheduledFor: str(args.scheduledFor) || undefined }
  }
  if (name === "create_site" && str(args.name)) {
    return { type: "create_site", name: str(args.name).slice(0, 120), headline: str(args.headline).slice(0, 180) || undefined }
  }
  if (name === "remember" && str(args.key) && str(args.value)) {
    return { type: "remember", key: str(args.key).slice(0, 80), value: str(args.value).slice(0, 1000) }
  }
  if (name === "log_message" && str(args.body)) {
    return { type: "log_message", contactName: str(args.contactName).slice(0, 80) || "Workspace", subject: str(args.subject).slice(0, 120) || undefined, body: str(args.body).slice(0, 2000) }
  }
  if (name === "draft_email_list" && str(args.name)) {
    return { type: "draft_email_list", name: str(args.name).slice(0, 120) }
  }
  if (name === "create_contact" && str(args.name)) {
    return { type: "create_contact", name: str(args.name).slice(0, 80), email: str(args.email).slice(0, 160) || undefined, company: str(args.company).slice(0, 120) || undefined }
  }
  if (name === "create_automation" && triggers.includes(str(args.trigger) as Trigger) && automationActions.includes(str(args.action) as AutomationAction)) {
    return { type: "create_automation", name: str(args.name).slice(0, 120) || "Studio automation", trigger: str(args.trigger) as Trigger, action: str(args.action) as AutomationAction }
  }
  if (name === "move_deal" && str(args.title) && stages.includes(str(args.stage) as Stage)) {
    return { type: "move_deal", title: str(args.title), stage: str(args.stage) as Stage }
  }
  return null
}

export type TrackedTask = {
  id: string
  role: SpecialistRoleId
  brief: string
  status: "queued" | "running" | "done" | "failed" | "cancelled"
  result: string
}

/** Mark queued work as running until the cap is full. Mutates and returns the newly running tasks. */
export function claimQueued(tasks: TrackedTask[], max = MAX_CONCURRENT_SPECIALISTS) {
  const running = tasks.filter((task) => task.status === "running").length
  let room = Math.max(0, max - running)
  const claimed: TrackedTask[] = []
  for (const task of tasks) {
    if (room <= 0) break
    if (task.status !== "queued") continue
    task.status = "running"
    claimed.push(task)
    room -= 1
  }
  return claimed
}

/**
 * Run every item, but never more than `max` at the same time.
 * Returns the highest number that were in flight together.
 */
export async function runWithCap<T>(items: T[], max: number, worker: (item: T) => Promise<void>) {
  const limit = Math.max(1, max)
  let active = 0
  let index = 0
  let peak = 0
  if (items.length === 0) return 0
  await new Promise<void>((resolve, reject) => {
    const launch = () => {
      if (index >= items.length && active === 0) {
        resolve()
        return
      }
      while (active < limit && index < items.length) {
        const item = items[index]
        index += 1
        active += 1
        peak = Math.max(peak, active)
        worker(item).then(() => {
          active -= 1
          launch()
        }, reject)
      }
    }
    launch()
  })
  return peak
}
