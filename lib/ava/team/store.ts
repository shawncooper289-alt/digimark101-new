import type { ApprovalStatus } from "@/lib/ava/team/approvals"
import type { AgentBrief } from "@/lib/ava/team/brief"
import type { TeamSlug } from "@/lib/ava/team/profiles"

export type RunStatus = "queued" | "running" | "review" | "done" | "failed" | "paused" | "cancelled"

export type StoredProfile = {
  slug: TeamSlug
  paused: boolean
  pauseReason: string | null
}

export type StoredRun = {
  id: string
  ownerId: string
  slug: TeamSlug
  status: RunStatus
  brief: AgentBrief
  tokensIn: number
  tokensOut: number
  costMicroUsd: number
  idempotencyKey: string | null
  parentRunId: string | null
  taskId: string | null
  error: string | null
  createdAt: string
}

export type StoredArtifact = {
  id: string
  runId: string | null
  ownerId: string
  slug: TeamSlug
  kind: string
  title: string
  body: string
  status: "draft" | "approved" | "published" | "rejected"
}

export type StoredApproval = {
  id: string
  ownerId: string
  actorId: string
  runId: string | null
  tool: string
  target: string
  params: Record<string, unknown>
  paramsHash: string
  effect: "read" | "write" | "destructive" | "outbound"
  status: ApprovalStatus
  expiresAt: string
}

export type StoredHandoff = {
  id: string
  ownerId: string
  goal: string
  audience: string
  brandVoice: string
  assets: string[]
  constraints: string
  deadline: string
  approvalNeeds: string
  successMetric: string
  briefText: string
  status: "open" | "submitted" | "reviewed"
  museResult: string | null
  avaReview: string | null
}

export type UsageSnapshot = {
  dayTokens: number
  agentMonthMicro: number
  totalMonthMicro: number
}

export interface TeamStore {
  ensureProfiles(ownerId: string): Promise<void>
  profile(ownerId: string, slug: TeamSlug): Promise<StoredProfile | null>
  setPaused(ownerId: string, slug: TeamSlug, paused: boolean, reason: string | null): Promise<void>
  pauseAll(ownerId: string, reason: string): Promise<void>
  findByIdempotency(ownerId: string, key: string): Promise<StoredRun | null>
  createRun(row: Omit<StoredRun, "id" | "createdAt" | "tokensIn" | "tokensOut" | "costMicroUsd" | "error"> & {
    priority?: number
    dueAt?: string | null
  }): Promise<StoredRun>
  updateRun(id: string, patch: Partial<Pick<StoredRun, "status" | "tokensIn" | "tokensOut" | "costMicroUsd" | "error" | "taskId">>): Promise<void>
  usageSince(ownerId: string, slug: TeamSlug, dayStartIso: string, monthStartIso: string): Promise<UsageSnapshot>
  addArtifact(row: Omit<StoredArtifact, "id">): Promise<StoredArtifact>
  addApproval(row: Omit<StoredApproval, "id" | "status"> & { status?: ApprovalStatus }): Promise<StoredApproval>
  getApproval(ownerId: string, id: string): Promise<StoredApproval | null>
  /** Marks one pending approval approved. A second caller gets null and must not run the tool. */
  claimApproval(ownerId: string, id: string, actorId: string, nowIso: string): Promise<StoredApproval | null>
  updateApproval(id: string, patch: Partial<Pick<StoredApproval, "status">> & { decidedAt?: string }): Promise<void>
  listRuns(ownerId: string): Promise<StoredRun[]>
  listApprovals(ownerId: string): Promise<StoredApproval[]>
  listArtifacts(ownerId: string): Promise<StoredArtifact[]>
  listProfiles(ownerId: string): Promise<StoredProfile[]>
  addHandoff(row: Omit<StoredHandoff, "id" | "status" | "museResult" | "avaReview">): Promise<StoredHandoff>
  listHandoffs(ownerId: string, status?: StoredHandoff["status"]): Promise<StoredHandoff[]>
  getHandoff(ownerId: string, id: string): Promise<StoredHandoff | null>
  updateHandoff(id: string, patch: Partial<Pick<StoredHandoff, "status" | "museResult" | "avaReview">>): Promise<void>
  listKpis(ownerId: string): Promise<{ source: string; metric: string; value: number; periodStart: string; periodEnd: string }[]>
  addKpis(ownerId: string, rows: { source: string; metric: string; value: number; periodStart: string; periodEnd: string }[]): Promise<number>
  queuedRuns(limit: number): Promise<StoredRun[]>
  claimRun(id: string): Promise<StoredRun | null>
}

export class TeamMigrationNeeded extends Error {
  constructor() {
    super("Apply supabase/migrations/20261126_ava_team.sql before the team desk can store work. Nothing was sent or charged.")
  }
}

export function dayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

export function monthStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}
