import { checkApproval } from "@/lib/ava/team/approvals"
import { decideBudget, estimateCostMicro, estimateTokens, MONTHLY_TOTAL_CAP_CENTS, overCap, type CostRates } from "@/lib/ava/team/budget"
import { parseBrief, type AgentBrief } from "@/lib/ava/team/brief"
import { digestSources } from "@/lib/ava/team/digest"
import { reviewArtifact } from "@/lib/ava/team/guard"
import { runBoundedLoop, type LoopChat } from "@/lib/ava/team/loop"
import { isTeamSlug, localDraft, teamProfile, type TeamSlug } from "@/lib/ava/team/profiles"
import { approvedAction, type ToolLookup } from "@/lib/ava/team/scope"
import { dayStart, monthStart, type StoredRun, type TeamStore } from "@/lib/ava/team/store"

export type TeamRunResult = {
  ok: boolean
  runId: string | null
  status: string
  text: string
  paused: boolean
  approvals: number
  denied: string[]
  missing: boolean
  reused: boolean
}

function sourcesFor(brief: AgentBrief, extra: string[]) {
  return [brief.goal, brief.audience, brief.notes, brief.successMetric, brief.constraints, ...brief.assets, ...extra]
}

export async function runTeamAgent(input: {
  ownerId: string
  actorId: string
  slug: string
  brief: unknown
  idempotencyKey?: string
  parentRunId?: string | null
  priority?: number
  now?: Date
  store: TeamStore
  chat: LoopChat
  lookup: (name: string) => ToolLookup
  execute: (name: string, args: Record<string, unknown>) => Promise<{ summary: string }>
  toolsFor: (allow: readonly string[]) => { name: string }[]
  rates?: CostRates
  totalCapCents?: number
  extraSources?: string[]
  resumeRun?: StoredRun | null
  onRun?: (runId: string) => void
}): Promise<TeamRunResult> {
  if (!isTeamSlug(input.slug)) {
    return { ok: false, runId: null, status: "failed", text: "That agent is not on the team.", paused: false, approvals: 0, denied: [], missing: false, reused: false }
  }
  const brief = parseBrief(input.brief)
  if (!brief) {
    return { ok: false, runId: null, status: "failed", text: "A brief needs a goal.", paused: false, approvals: 0, denied: [], missing: false, reused: false }
  }
  const profile = teamProfile(input.slug)
  if (!profile) {
    return { ok: false, runId: null, status: "failed", text: "That agent is not on the team.", paused: false, approvals: 0, denied: [], missing: false, reused: false }
  }
  const now = input.now ?? new Date()
  await input.store.ensureProfiles(input.ownerId)
  const key = input.idempotencyKey?.trim().slice(0, 120) || ""
  if (key && !input.resumeRun) {
    const existing = await input.store.findByIdempotency(input.ownerId, key)
    if (existing) {
      return { ok: true, runId: existing.id, status: existing.status, text: "That request is already on the board.", paused: existing.status === "paused", approvals: 0, denied: [], missing: false, reused: true }
    }
  }
  const stored = await input.store.profile(input.ownerId, input.slug)
  const paused = stored?.paused === true
  const usage = await input.store.usageSince(input.ownerId, input.slug, dayStart(now), monthStart(now))
  const totalCap = input.totalCapCents ?? MONTHLY_TOTAL_CAP_CENTS
  const estimate = estimateTokens(brief.goal) + 800
  const gate = decideBudget({
    paused,
    runTokens: 0,
    dayTokens: usage.dayTokens,
    agentMonthMicro: usage.agentMonthMicro,
    totalMonthMicro: usage.totalMonthMicro,
    perRunCap: profile.perRunTokenCap,
    dayCap: profile.dailyTokenCap,
    agentMonthCapCents: profile.monthlyBudgetCents,
    totalMonthCapCents: totalCap,
    nextTokens: estimate,
    nextMicro: estimateCostMicro(estimate, 0, input.rates),
  })
  if (!gate.allow) {
    if (gate.pauseAll) await input.store.pauseAll(input.ownerId, gate.reason)
    else if (gate.pause) await input.store.setPaused(input.ownerId, input.slug, true, gate.reason)
    if (input.resumeRun) {
      await input.store.updateRun(input.resumeRun.id, { status: gate.pause ? "paused" : "failed", error: gate.reason })
      return { ok: false, runId: input.resumeRun.id, status: gate.pause ? "paused" : "failed", text: gate.reason, paused: gate.pause, approvals: 0, denied: [], missing: false, reused: false }
    }
    const run = await input.store.createRun({
      ownerId: input.ownerId,
      slug: input.slug,
      status: gate.pause ? "paused" : "failed",
      brief,
      idempotencyKey: key || null,
      parentRunId: input.parentRunId ?? null,
      taskId: null,
      priority: input.priority ?? 0,
      dueAt: null,
    })
    await input.store.updateRun(run.id, { error: gate.reason })
    return { ok: false, runId: run.id, status: run.status, text: gate.reason, paused: gate.pause, approvals: 0, denied: [], missing: false, reused: false }
  }

  const run = input.resumeRun
    ? await input.store.claimRun(input.resumeRun.id)
    : await input.store.createRun({
      ownerId: input.ownerId,
      slug: input.slug,
      status: "running",
      brief,
      idempotencyKey: key || null,
      parentRunId: input.parentRunId ?? null,
      taskId: null,
      priority: input.priority ?? 0,
      dueAt: null,
    })
  if (!run) {
    return { ok: true, runId: input.resumeRun?.id ?? null, status: "running", text: "That run was already picked up.", paused: false, approvals: 0, denied: [], missing: false, reused: true }
  }
  input.onRun?.(run.id)
  const sources = sourcesFor(brief, input.extraSources ?? [])
  const loop = await runBoundedLoop({
    system: profile.prompt,
    brief,
    allow: profile.tools,
    sources,
    lookup: input.lookup,
    chat: input.chat,
    execute: input.execute,
    budget: {
      paused: false,
      runTokens: 0,
      dayTokens: usage.dayTokens,
      agentMonthMicro: usage.agentMonthMicro,
      totalMonthMicro: usage.totalMonthMicro,
      perRunCap: profile.perRunTokenCap,
      dayCap: profile.dailyTokenCap,
      agentMonthCapCents: profile.monthlyBudgetCents,
      totalMonthCapCents: totalCap,
    },
    rates: input.rates,
    now,
    tools: input.toolsFor(profile.tools),
  })
  const draft = loop.missing ? localDraft(input.slug, brief.goal) : { kind: "draft", title: `${profile.slug} draft`, body: loop.text }
  const body = draft.body
  const review = reviewArtifact(body, sources)
  await input.store.addArtifact({
    ownerId: input.ownerId,
    runId: run.id,
    slug: input.slug,
    kind: draft.kind,
    title: draft.title,
    body,
    status: "draft",
  })
  if (input.slug !== "sentinel") {
    await input.store.addArtifact({
      ownerId: input.ownerId,
      runId: run.id,
      slug: "sentinel",
      kind: "sentinel_review",
      title: "Review",
      body: review.pass
        ? "Review passed. No invented number, banned line, or send claim. The piece stays a draft."
        : `Review held this draft: ${review.issues.join(", ")}. Nothing was sent, posted, or charged.`,
      status: "draft",
    })
  }
  for (const approval of loop.approvals) {
    await input.store.addApproval({
      ownerId: input.ownerId,
      actorId: input.actorId,
      runId: run.id,
      tool: approval.tool,
      target: approval.target,
      params: approval.params,
      paramsHash: approval.paramsHash,
      effect: approval.effect,
      expiresAt: approval.expiresAt,
    })
  }
  const cost = estimateCostMicro(loop.tokensIn, loop.tokensOut, input.rates)
  const status = loop.missing ? "done" : review.pass ? "done" : "review"
  await input.store.updateRun(run.id, {
    status: loop.stopped && !loop.text && !loop.missing ? "failed" : status,
    tokensIn: loop.tokensIn,
    tokensOut: loop.tokensOut,
    costMicroUsd: cost,
    error: loop.stopped,
  })
  const after = await input.store.usageSince(input.ownerId, input.slug, dayStart(now), monthStart(now))
  const tripped = overCap({
    dayTokens: after.dayTokens,
    dayCap: profile.dailyTokenCap,
    agentMonthMicro: after.agentMonthMicro,
    agentMonthCapCents: profile.monthlyBudgetCents,
    totalMonthMicro: after.totalMonthMicro,
    totalMonthCapCents: totalCap,
  })
  if (tripped?.pauseAll) await input.store.pauseAll(input.ownerId, tripped.reason)
  else if (tripped?.pause) await input.store.setPaused(input.ownerId, input.slug, true, tripped.reason)
  return {
    ok: true,
    runId: run.id,
    status,
    text: body,
    paused: Boolean(tripped?.pause),
    approvals: loop.approvals.length,
    denied: loop.denied,
    missing: loop.missing,
    reused: false,
  }
}

export async function decideOwnerApproval(input: {
  store: TeamStore
  ownerId: string
  actorId: string
  approvalId: string
  now?: Date
  execute: (tool: string, params: Record<string, unknown>) => Promise<{ summary: string }>
  override?: { tool?: string; target?: string; params?: Record<string, unknown> }
}) {
  const now = input.now ?? new Date()
  const row = await input.store.getApproval(input.ownerId, input.approvalId)
  if (!row) return { ok: false, executed: false, reason: "That approval is not in this workspace." }
  if (row.status !== "pending") return { ok: false, executed: false, reason: "That approval is already closed." }
  const request = {
    actorId: input.actorId,
    tool: input.override?.tool ?? row.tool,
    target: input.override?.target ?? row.target,
    params: input.override?.params ?? row.params,
  }
  const check = checkApproval(row, request, now)
  if (!check.ok) {
    if (check.reason.includes("expired")) await input.store.updateApproval(row.id, { status: "expired", decidedAt: now.toISOString() })
    return { ok: false, executed: false, reason: check.reason }
  }
  if (!approvedAction(row.tool)) return { ok: false, executed: false, reason: "That tool cannot be released from the inbox." }
  await input.store.updateApproval(row.id, { status: "approved", decidedAt: now.toISOString() })
  const outcome = await input.execute(row.tool, row.params)
  return { ok: true, executed: true, reason: outcome.summary }
}

export async function rejectOwnerApproval(input: { store: TeamStore; ownerId: string; approvalId: string; now?: Date }) {
  const row = await input.store.getApproval(input.ownerId, input.approvalId)
  if (!row || row.status !== "pending") return { ok: false, reason: "That approval is not waiting." }
  await input.store.updateApproval(row.id, { status: "rejected", decidedAt: (input.now ?? new Date()).toISOString() })
  return { ok: true, reason: "Rejected. Nothing was sent, posted, or charged." }
}

export function kpiSourceLines(rows: { value: number; metric: string }[]) {
  return digestSources(rows.map((row) => ({ ...row, source: "", periodStart: "", periodEnd: "" })))
}

export type { TeamSlug }
