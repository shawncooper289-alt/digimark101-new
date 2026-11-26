import type { TeamSlug } from "@/lib/ava/team/profiles"
import { TEAM_PROFILES } from "@/lib/ava/team/profiles"
import type { StoredApproval, StoredArtifact, StoredHandoff, StoredProfile, StoredRun, TeamStore } from "@/lib/ava/team/store"

function id() {
  return crypto.randomUUID()
}

export function memoryTeamStore(): TeamStore {
  const profiles = new Map<string, StoredProfile>()
  const runs: StoredRun[] = []
  const artifacts: StoredArtifact[] = []
  const approvals: StoredApproval[] = []
  const handoffs: StoredHandoff[] = []
  const kpis: { ownerId: string; source: string; metric: string; value: number; periodStart: string; periodEnd: string }[] = []

  function key(ownerId: string, slug: string) {
    return `${ownerId}:${slug}`
  }

  return {
    async ensureProfiles(ownerId) {
      for (const profile of TEAM_PROFILES) {
        const slot = key(ownerId, profile.slug)
        if (!profiles.has(slot)) profiles.set(slot, { slug: profile.slug, paused: false, pauseReason: null })
      }
    },
    async profile(ownerId, slug) {
      return profiles.get(key(ownerId, slug)) ?? null
    },
    async setPaused(ownerId, slug, paused, reason) {
      profiles.set(key(ownerId, slug), { slug, paused, pauseReason: reason })
    },
    async pauseAll(ownerId, reason) {
      for (const profile of TEAM_PROFILES) profiles.set(key(ownerId, profile.slug), { slug: profile.slug, paused: true, pauseReason: reason })
    },
    async findByIdempotency(ownerId, idempotencyKey) {
      return runs.find((run) => run.ownerId === ownerId && run.idempotencyKey === idempotencyKey) ?? null
    },
    async createRun(row) {
      const run: StoredRun = {
        id: id(),
        ownerId: row.ownerId,
        slug: row.slug,
        status: row.status,
        brief: row.brief,
        tokensIn: 0,
        tokensOut: 0,
        costMicroUsd: 0,
        idempotencyKey: row.idempotencyKey,
        parentRunId: row.parentRunId,
        taskId: row.taskId,
        error: null,
        createdAt: new Date().toISOString(),
      }
      runs.push(run)
      return run
    },
    async updateRun(runId, patch) {
      const run = runs.find((item) => item.id === runId)
      if (!run) return
      Object.assign(run, patch)
    },
    async usageSince(ownerId, slug, dayStartIso, monthStartIso) {
      let dayTokens = 0
      let agentMonthMicro = 0
      let totalMonthMicro = 0
      for (const run of runs) {
        if (run.ownerId !== ownerId) continue
        if (run.createdAt >= monthStartIso) {
          totalMonthMicro += run.costMicroUsd
          if (run.slug === slug) agentMonthMicro += run.costMicroUsd
        }
        if (run.slug === slug && run.createdAt >= dayStartIso) dayTokens += run.tokensIn + run.tokensOut
      }
      return { dayTokens, agentMonthMicro, totalMonthMicro }
    },
    async addArtifact(row) {
      const artifact: StoredArtifact = { ...row, id: id() }
      artifacts.push(artifact)
      return artifact
    },
    async addApproval(row) {
      const approval: StoredApproval = { ...row, id: id(), status: row.status ?? "pending" }
      approvals.push(approval)
      return approval
    },
    async getApproval(ownerId, approvalId) {
      return approvals.find((item) => item.ownerId === ownerId && item.id === approvalId) ?? null
    },
    async updateApproval(approvalId, patch) {
      const approval = approvals.find((item) => item.id === approvalId)
      if (!approval) return
      if (patch.status) approval.status = patch.status
    },
    async listRuns(ownerId) {
      return runs.filter((run) => run.ownerId === ownerId)
    },
    async listApprovals(ownerId) {
      return approvals.filter((item) => item.ownerId === ownerId)
    },
    async listArtifacts(ownerId) {
      return artifacts.filter((item) => item.ownerId === ownerId)
    },
    async listProfiles(ownerId) {
      return TEAM_PROFILES.map((profile) => profiles.get(key(ownerId, profile.slug))).filter((item): item is StoredProfile => Boolean(item))
    },
    async addHandoff(row) {
      const handoff: StoredHandoff = { ...row, id: id(), status: "open", museResult: null, avaReview: null }
      handoffs.push(handoff)
      return handoff
    },
    async listHandoffs(ownerId, status) {
      return handoffs.filter((item) => item.ownerId === ownerId && (!status || item.status === status))
    },
    async getHandoff(ownerId, handoffId) {
      return handoffs.find((item) => item.ownerId === ownerId && item.id === handoffId) ?? null
    },
    async updateHandoff(handoffId, patch) {
      const handoff = handoffs.find((item) => item.id === handoffId)
      if (!handoff) return
      Object.assign(handoff, patch)
    },
    async listKpis(ownerId) {
      return kpis.filter((row) => row.ownerId === ownerId).map(({ source, metric, value, periodStart, periodEnd }) => ({ source, metric, value, periodStart, periodEnd }))
    },
    async addKpis(ownerId, rows) {
      for (const row of rows) kpis.push({ ownerId, ...row })
      return rows.length
    },
    async queuedRuns(limit) {
      return runs.filter((run) => run.status === "queued").slice(0, limit)
    },
    async claimRun(runId) {
      const run = runs.find((item) => item.id === runId && item.status === "queued")
      if (!run) return null
      run.status = "running"
      return run
    },
  }
}

export type { TeamSlug }
