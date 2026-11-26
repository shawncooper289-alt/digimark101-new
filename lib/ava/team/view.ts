import { budgetMeter, MONTHLY_TOTAL_CAP_CENTS } from "@/lib/ava/team/budget"
import { TEAM_PROFILES, type TeamSlug } from "@/lib/ava/team/profiles"
import type { StoredApproval, StoredHandoff, StoredProfile, StoredRun } from "@/lib/ava/team/store"

export type TeamDeskData = {
  ready: boolean
  message: string
  meter: { label: string; ratio: number; spentCents: number; capCents: number }
  cards: {
    slug: TeamSlug
    title: string
    autonomy: string
    tools: number
    paused: boolean
    pauseReason: string | null
  }[]
  columns: { status: string; runs: { id: string; slug: TeamSlug; goal: string; status: string }[] }[]
  approvals: { id: string; tool: string; target: string; expiresAt: string; status: string }[]
  handoffs: { id: string; goal: string; briefText: string; status: string; museResult: string; avaReview: string }[]
}

const COLUMNS = ["queued", "running", "review", "done", "failed", "paused"] as const

export function teamDeskData(input: {
  ready: boolean
  message?: string
  profiles: StoredProfile[]
  runs: StoredRun[]
  approvals: StoredApproval[]
  handoffs: StoredHandoff[]
  spentMicro: number
}): TeamDeskData {
  const meter = budgetMeter(input.spentMicro, MONTHLY_TOTAL_CAP_CENTS)
  return {
    ready: input.ready,
    message: input.message || "",
    meter,
    cards: TEAM_PROFILES.map((profile) => {
      const live = input.profiles.find((item) => item.slug === profile.slug)
      return {
        slug: profile.slug,
        title: profile.title,
        autonomy: profile.autonomy,
        tools: profile.tools.length,
        paused: live?.paused === true,
        pauseReason: live?.pauseReason ?? null,
      }
    }),
    columns: COLUMNS.map((status) => ({
      status,
      runs: input.runs.filter((run) => run.status === status).slice(0, 12).map((run) => ({
        id: run.id,
        slug: run.slug,
        goal: run.brief.goal,
        status: run.status,
      })),
    })),
    approvals: input.approvals.filter((item) => item.status === "pending").map((item) => ({
      id: item.id,
      tool: item.tool,
      target: item.target,
      expiresAt: item.expiresAt,
      status: item.status,
    })),
    handoffs: input.handoffs.map((item) => ({
      id: item.id,
      goal: item.goal,
      briefText: item.briefText,
      status: item.status,
      museResult: item.museResult || "",
      avaReview: item.avaReview || "",
    })),
  }
}
