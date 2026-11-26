export type AgentBrief = {
  goal: string
  audience: string
  brandVoice: string
  assets: string[]
  constraints: string
  deadline: string
  approvalNeeds: string
  successMetric: string
  notes: string
}

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export function parseBrief(input: unknown): AgentBrief | null {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {}
  const goal = clip(source.goal ?? source.brief ?? source.notes, 2000)
  if (goal.length < 2) return null
  const assets = Array.isArray(source.assets)
    ? source.assets.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 300)).filter(Boolean).slice(0, 12)
    : clip(source.assets, 1000).split(/\n+/).map((item) => item.trim()).filter(Boolean).slice(0, 12)
  return {
    goal,
    audience: clip(source.audience, 400),
    brandVoice: clip(source.brandVoice ?? source.brand_voice, 400),
    assets,
    constraints: clip(source.constraints, 800),
    deadline: clip(source.deadline, 120),
    approvalNeeds: clip(source.approvalNeeds ?? source.approval_needs, 400),
    successMetric: clip(source.successMetric ?? source.success_metric, 240),
    notes: clip(source.notes, 2000),
  }
}

export const MUSE_BRIEF_FIELDS = [
  "goal",
  "audience",
  "brandVoice",
  "assets",
  "constraints",
  "deadline",
  "approvalNeeds",
  "successMetric",
] as const
