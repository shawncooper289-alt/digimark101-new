import { BANNED_LINE_RULE } from "@/lib/ava/banned-line"
import { DEFAULT_AGENT_MONTHLY_CENTS, DEFAULT_DAILY_TOKEN_CAP, DEFAULT_PER_RUN_TOKEN_CAP } from "@/lib/ava/team/budget"

export const TEAM_SLUGS = ["traffic", "content", "nurture", "outreach", "sentinel"] as const

export type TeamSlug = (typeof TEAM_SLUGS)[number]

export type Autonomy = "draft" | "confirm" | "read_only"

export type AgentProfile = {
  slug: TeamSlug
  title: string
  autonomy: Autonomy
  monthlyBudgetCents: number
  dailyTokenCap: number
  perRunTokenCap: number
  tools: readonly string[]
  prompt: string
}

const SHARED = `${BANNED_LINE_RULE}
You work for Ava Skye inside DigiMark101. Ava is the manager. You are not named to a client.
Do not invent clients, testimonials, revenue, ad results, rankings, clicks, impressions, sessions, or leads.
If a measurement source is not connected, say it is not connected. Do not fill the gap with a number.
Do not email, text, call, publish, spend, or contact a person. Those actions wait for the owner.
Write in plain American English.`

export const TEAM_PROFILES: readonly AgentProfile[] = [
  {
    slug: "traffic",
    title: "Traffic Growth",
    autonomy: "draft",
    monthlyBudgetCents: DEFAULT_AGENT_MONTHLY_CENTS,
    dailyTokenCap: DEFAULT_DAILY_TOKEN_CAP,
    perRunTokenCap: DEFAULT_PER_RUN_TOKEN_CAP,
    tools: ["traffic_audit", "traffic_keywords", "traffic_brief", "traffic_draft", "traffic_links", "traffic_kpis", "sites_list", "reports_summary", "indexnow_submit"],
    prompt: `You grow free organic traffic to digimark101.com.
You may audit the site setup, propose keywords and topic clusters from the brief, draft content briefs and pages, propose internal links, and read stored KPI rows.
Google Search Console, GA4, and Bing Webmaster are read-only and only when their keys are set. IndexNow submission waits for the owner.
${SHARED}`,
  },
  {
    slug: "content",
    title: "Content & Social",
    autonomy: "draft",
    monthlyBudgetCents: DEFAULT_AGENT_MONTHLY_CENTS,
    dailyTokenCap: DEFAULT_DAILY_TOKEN_CAP,
    perRunTokenCap: DEFAULT_PER_RUN_TOKEN_CAP,
    tools: ["social_list", "social_draft", "content_calendar", "content_repurpose", "content_request_publish"],
    prompt: `You turn a topic cluster into drafts for LinkedIn, X, a YouTube script, and a Meta-ready post, and you keep a content calendar.
Saving a draft does not publish it. A publish request goes to the owner inbox. You cannot post to a network.
${SHARED}`,
  },
  {
    slug: "nurture",
    title: "Lead Capture & Nurture",
    autonomy: "draft",
    monthlyBudgetCents: DEFAULT_AGENT_MONTHLY_CENTS,
    dailyTokenCap: DEFAULT_DAILY_TOKEN_CAP,
    perRunTokenCap: DEFAULT_PER_RUN_TOKEN_CAP,
    tools: ["forms_list", "forms_create", "campaigns_list", "campaigns_draft", "nurture_form", "nurture_magnet", "nurture_sequence", "nurture_score", "nurture_request_send"],
    prompt: `You draft forms, a spec for a free website-audit lead magnet, email sequences, and a lead score.
A send waits for the owner and for consent. You do not email or text anyone. You do not invent a conversion rate.
${SHARED}`,
  },
  {
    slug: "outreach",
    title: "Authority & Outreach",
    autonomy: "draft",
    monthlyBudgetCents: DEFAULT_AGENT_MONTHLY_CENTS,
    dailyTokenCap: DEFAULT_DAILY_TOKEN_CAP,
    perRunTokenCap: DEFAULT_PER_RUN_TOKEN_CAP,
    tools: ["outreach_queries", "outreach_pitch", "inbox_log"],
    prompt: `You look for press queries, directory listings, newsletter swaps, and public questions only when the owner pastes them.
You draft pitches and replies for Shawn to send himself. You do not contact anyone and you do not submit a listing.
Directories you may name as places to set up: Clutch, DesignRush, Sortlist. Do not claim a profile exists unless the brief says so.
${SHARED}`,
  },
  {
    slug: "sentinel",
    title: "Sentinel",
    autonomy: "read_only",
    monthlyBudgetCents: DEFAULT_AGENT_MONTHLY_CENTS,
    dailyTokenCap: DEFAULT_DAILY_TOKEN_CAP,
    perRunTokenCap: DEFAULT_PER_RUN_TOKEN_CAP,
    tools: ["reports_summary", "traffic_kpis", "sentinel_budget", "sentinel_rubric"],
    prompt: `You review other drafts and read spend. You are read-only.
You do not publish, send, spend, delete, or contact a person. You do not invent a score or a metric.
A pause happens in code when a cap is hit. You may report that a cap was hit only from the numbers you were given.
${SHARED}`,
  },
]

const bySlug = new Map(TEAM_PROFILES.map((profile) => [profile.slug, profile]))

export function isTeamSlug(value: string): value is TeamSlug {
  return (TEAM_SLUGS as readonly string[]).includes(value)
}

export function teamProfile(slug: string) {
  return bySlug.get(slug as TeamSlug) ?? null
}

export function localDraft(slug: TeamSlug, goal: string) {
  const topic = goal.replace(/\s+/g, " ").trim().slice(0, 400) || "the brief"
  const drafts: Record<TeamSlug, { kind: string; title: string; body: string }> = {
    traffic: {
      kind: "content_brief",
      title: "Traffic starter",
      body: `Working note for: ${topic}\n\nNo click, impression, session, or ranking number is included, because no measurement was attached.\nNext: connect Search Console, Bing, and GA4, then replace this note with stored rows only.\n\nThis is a draft. Nothing was published.`,
    },
    content: {
      kind: "social_pack",
      title: "Social starter",
      body: `Draft pack for: ${topic}\n\nLinkedIn: one short post, with the date left blank.\nX: the same idea in two sentences.\nYouTube: a script outline with no runtime claim.\nMeta: one post the owner can paste later.\n\nThese are drafts. They are not scheduled on a network.`,
    },
    nurture: {
      kind: "lead_magnet",
      title: "Lead magnet spec",
      body: `Free website audit, spec only, for: ${topic}\n\nThe form asks for a site address and consent to be contacted. No message is sent from this draft.\nThe audit result stays blank until a real check is run. Do not print a score.\n\nNothing was emailed.`,
    },
    outreach: {
      kind: "pitch",
      title: "Pitch starter",
      body: `Pitch Shawn can send himself, about: ${topic}\n\nNo recipient was contacted. If a press query or directory login was not pasted in, this draft does not pretend one was found.\n\nShawn sends this. The draft does not.`,
    },
    sentinel: {
      kind: "review",
      title: "Review",
      body: `Review of: ${topic}\n\nChecked for invented numbers, the banned line, and helper names.\nA send or a post is not claimed here.\nNo spend figure is included unless a stored total was provided.\n\nThis review does not change the draft into a published piece.`,
    },
  }
  return drafts[slug]
}
