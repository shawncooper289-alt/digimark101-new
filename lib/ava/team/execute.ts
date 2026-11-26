import type { TeamSlug } from "@/lib/ava/team/profiles"
import { auditLines, submitIndexNow, type FetchLike } from "@/lib/ava/team/providers"
import { trafficDigest } from "@/lib/ava/team/digest"
import { museBriefText } from "@/lib/ava/team/muse"
import { parseBrief } from "@/lib/ava/team/brief"
import { budgetMeter, MONTHLY_TOTAL_CAP_CENTS } from "@/lib/ava/team/budget"
import { TEAM_PROFILES } from "@/lib/ava/team/profiles"
import type { TeamStore } from "@/lib/ava/team/store"
import { monthStart } from "@/lib/ava/team/store"

type Env = Record<string, string | undefined>

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

const TEAM_TOOLS = new Set([
  "traffic_audit",
  "traffic_keywords",
  "traffic_brief",
  "traffic_draft",
  "traffic_links",
  "traffic_kpis",
  "indexnow_submit",
  "content_calendar",
  "content_repurpose",
  "content_request_publish",
  "nurture_form",
  "nurture_magnet",
  "nurture_sequence",
  "nurture_score",
  "nurture_request_send",
  "outreach_queries",
  "outreach_pitch",
  "sentinel_budget",
  "sentinel_rubric",
])

export function isTeamTool(name: string) {
  return TEAM_TOOLS.has(name)
}

export async function runTeamTool(input: {
  name: string
  args: Record<string, unknown>
  env?: Env
  store: TeamStore
  ownerId: string
  runId?: string | null
  slug: TeamSlug
  fetchImpl?: FetchLike
  siteUrl?: string
}): Promise<{ summary: string } | null> {
  if (!isTeamTool(input.name)) return null
  const env = input.env ?? process.env
  const goal = clip(input.args.goal ?? input.args.topic ?? input.args.body ?? input.args.name, 800)
  const save = async (kind: string, title: string, body: string) => {
    await input.store.addArtifact({
      ownerId: input.ownerId,
      runId: input.runId ?? null,
      slug: input.slug,
      kind,
      title,
      body,
      status: "draft",
    })
    return { summary: body }
  }
  switch (input.name) {
    case "traffic_audit":
      return { summary: `Site checks use configuration only.\n${auditLines(env)}\nNo traffic number is included.` }
    case "traffic_keywords":
      return save("keyword_note", "Keyword note", goal
        ? `Topic from the brief: ${goal}\nNo search-volume source is connected, so no volume is stated.`
        : "No topic was provided, and no search volume is stated.")
    case "traffic_brief":
      return save("content_brief", "Content brief", `Brief: ${goal || "Untitled"}\nAudience: ${clip(input.args.audience, 300) || "Not set."}\nThis is a draft page plan. It is not published.`)
    case "traffic_draft":
      return save("page_draft", "Page draft", `Draft: ${goal || "Untitled"}\nLeave proof and numbers blank until a real source is attached.\nThis is not a published page.`)
    case "traffic_links":
      return save("internal_links", "Internal link proposal", `Proposed links for: ${goal || "the site"}\nThese are proposals. No page was changed.`)
    case "traffic_kpis": {
      const rows = await input.store.listKpis(input.ownerId)
      return { summary: trafficDigest({ kpis: rows, missing: [] }) }
    }
    case "indexnow_submit":
      return { summary: "IndexNow stays in the owner inbox. Nothing was submitted." }
    case "content_calendar":
      return save("calendar", "Content calendar", `Calendar draft for: ${goal || "this week"}\nDates are blank until the owner sets them. Nothing is scheduled on a network.`)
    case "content_repurpose":
      return save("social_pack", "Repurposed drafts", `LinkedIn, X, YouTube script, and a Meta-ready post for: ${goal || "the cluster"}.\nThese are drafts. They were not published.`)
    case "content_request_publish":
      return { summary: "Publish request filed for the owner. The post was not published." }
    case "nurture_form":
      return save("form", "Form draft", `Form draft: ${goal || "Lead form"}\nInclude a consent line before any contact. Nothing was sent.`)
    case "nurture_magnet":
      return save("lead_magnet", "Website audit spec", "Free website audit, spec only. Ask for a site address and consent. Do not print a score. Nothing was emailed.")
    case "nurture_sequence":
      return save("email_sequence", "Email sequence", `Sequence draft for: ${goal || "new leads"}\nEach email stays a draft until the owner approves a send and consent is on file. Nothing was emailed.`)
    case "nurture_score":
      return save("lead_score", "Lead score draft", "Score from facts the owner already stored. No conversion rate is invented. A score does not send a message.")
    case "nurture_request_send":
      return { summary: "Send request filed for the owner. Nothing was emailed or texted." }
    case "outreach_queries": {
      const pasted = clip(input.args.pasted ?? input.args.queries ?? input.args.body, 4000)
      return save("press_queries", "Press queries", pasted
        ? `Pasted by the owner:\n${pasted}\nThese were not fetched from a press service.`
        : "No press query, directory login, or question was pasted. None was fetched.")
    }
    case "outreach_pitch":
      return save("pitch", "Pitch draft", `Draft for Shawn to send himself, about: ${goal || "the note"}.\nNo person was contacted.`)
    case "sentinel_budget": {
      const usage = await input.store.usageSince(input.ownerId, input.slug, new Date(0).toISOString(), monthStart(new Date()))
      const meter = budgetMeter(usage.totalMonthMicro, MONTHLY_TOTAL_CAP_CENTS)
      const paused = (await input.store.listProfiles(input.ownerId)).filter((profile) => profile.paused).map((profile) => profile.slug)
      return { summary: `Model spend: ${meter.label}. Paused agents: ${paused.length ? paused.join(", ") : "none"}.` }
    }
    case "sentinel_rubric":
      return {
        summary: "Review checks: invented numbers, the banned line, helper names, and any claim that something was published, sent, charged, or used to contact a person. A failed check keeps the piece a draft.",
      }
    default:
      return null
  }
}

export async function releaseApprovedTool(input: {
  tool: string
  params: Record<string, unknown>
  env?: Env
  fetchImpl: FetchLike
  siteUrl: string
  schedulePost: (params: Record<string, unknown>) => Promise<{ summary: string }>
  queueCampaign: (params: Record<string, unknown>) => Promise<{ summary: string }>
}) {
  if (input.tool === "indexnow_submit") {
    const urls = [input.siteUrl, clip(input.params.url, 300)].filter(Boolean)
    const result = await submitIndexNow(input.env ?? process.env, urls, input.fetchImpl, input.siteUrl)
    return { summary: result.summary }
  }
  if (input.tool === "content_request_publish") return input.schedulePost(input.params)
  if (input.tool === "nurture_request_send") return input.queueCampaign(input.params)
  return { summary: "Nothing was released." }
}

export function profileCards() {
  return TEAM_PROFILES.map((profile) => ({
    slug: profile.slug,
    title: profile.title,
    autonomy: profile.autonomy,
    tools: profile.tools.length,
    monthlyBudgetCents: profile.monthlyBudgetCents,
  }))
}

export function handoffFromArgs(ownerId: string, args: Record<string, unknown>) {
  const brief = parseBrief({ ...args, goal: args.goal ?? args.brief })
  if (!brief) return null
  return {
    ownerId,
    goal: brief.goal,
    audience: brief.audience,
    brandVoice: brief.brandVoice,
    assets: brief.assets,
    constraints: brief.constraints,
    deadline: brief.deadline,
    approvalNeeds: brief.approvalNeeds,
    successMetric: brief.successMetric,
    briefText: museBriefText(brief),
  }
}
