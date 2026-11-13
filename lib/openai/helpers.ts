import { BANNED_LINE_RULE, omitBannedLine } from "@/lib/ava/banned-line"

/** Hard cap. A seventh job waits until one of these finishes. */
export const HELPER_CAP = 6

export const HELPER_ROLES = [
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

export type HelperRoleId = (typeof HELPER_ROLES)[number]["id"]

const ROLE_IDS = HELPER_ROLES.map((role) => role.id)

export function isHelperRole(value: string): value is HelperRoleId {
  return (ROLE_IDS as readonly string[]).includes(value)
}

export function helperRole(id: string) {
  return HELPER_ROLES.find((role) => role.id === id) ?? null
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

export function helperTools(roleId: string) {
  const role = helperRole(roleId)
  if (!role) return []
  return role.tools
    .filter((name) => TOOL_DEFS[name])
    .map((name) => ({ type: "function", function: { name, description: TOOL_DEFS[name].description, parameters: TOOL_DEFS[name].parameters } }))
}

export function helperSystemPrompt(roleId: string) {
  const role = helperRole(roleId)
  if (!role) return SHARED_RULES
  return `You help Ava Skye inside DigiMark101. Your job: ${role.scope}
You may only suggest these workspace drafts: ${role.tools.join(", ")}. Anything else is out of scope.
${SHARED_RULES}`
}

export function delegateWorkTool() {
  return {
    type: "function",
    function: {
      name: "delegate_work",
      description: "Hand specialized drafts to internal helpers. Never mention the helpers to a client. At most 6 run at once; extra jobs wait. Helpers only draft. They cannot send, post, or spend.",
      parameters: {
        type: "object",
        properties: {
          jobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: [...ROLE_IDS] },
                brief: { type: "string" },
              },
              required: ["role", "brief"],
            },
          },
        },
        required: ["jobs"],
      },
    },
  }
}

/** Ava reads the helper drafts and answers the client herself. */
export function avaReviewSystem() {
  return `You are Ava Skye. You are speaking to the client. Rewrite the draft notes into one finished answer in your own voice.
Do not mention helpers, bots, specialists, or that anyone else worked on this.
Do not invent clients, reviews, revenue, ad results, or traffic numbers.
Say that this is a draft and that nothing was sent, posted, or charged.
The name Ava is pronounced AY-vuh.
Use plain American English. If you use a technical word, explain it in the same sentence.
${BANNED_LINE_RULE}`
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

/** Drop helper names and the banned preview line from model text. */
export function hideInternalNames(text: string) {
  let cleaned = text
  for (const word of INTERNAL_WORDS) {
    const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
    cleaned = cleaned.replace(pattern, "")
  }
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  return omitBannedLine(cleaned)
}
