import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { TEAM_PROFILES, isTeamSlug, type TeamSlug } from "@/lib/ava/team/profiles"
import type { AgentBrief } from "@/lib/ava/team/brief"
import { TeamMigrationNeeded, type StoredApproval, type StoredArtifact, type StoredHandoff, type StoredProfile, type StoredRun, type TeamStore } from "@/lib/ava/team/store"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

type Row = Record<string, unknown>

function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" ? value : ""
}

function fail(error: { message: string } | null) {
  if (!error) return
  if (/does not exist|schema cache|Could not find the|claim_agent_tasks/i.test(error.message)) throw new TeamMigrationNeeded()
  console.error("Ava team store failed", error.message)
  throw new Error("Could not update the team desk.")
}

function asBrief(value: unknown): AgentBrief {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  return {
    goal: text(row, "goal"),
    audience: text(row, "audience"),
    brandVoice: text(row, "brandVoice"),
    assets: Array.isArray(row.assets) ? row.assets.filter((item): item is string => typeof item === "string") : [],
    constraints: text(row, "constraints"),
    deadline: text(row, "deadline"),
    approvalNeeds: text(row, "approvalNeeds"),
    successMetric: text(row, "successMetric"),
    notes: text(row, "notes"),
  }
}

function mapRun(row: Row): StoredRun | null {
  const slug = text(row, "agent_slug")
  if (!isTeamSlug(slug)) return null
  return {
    id: text(row, "id"),
    ownerId: text(row, "owner_id"),
    slug,
    status: text(row, "status") as StoredRun["status"],
    brief: asBrief(row.brief),
    tokensIn: Number(row.tokens_in) || 0,
    tokensOut: Number(row.tokens_out) || 0,
    costMicroUsd: Number(row.cost_micro_usd) || 0,
    idempotencyKey: text(row, "idempotency_key") || null,
    parentRunId: text(row, "parent_run_id") || null,
    taskId: text(row, "task_id") || null,
    error: text(row, "error") || null,
    createdAt: text(row, "created_at"),
  }
}

export function supabaseTeamStore(client: SupabaseClient | null = createSupabaseAdmin()): TeamStore | null {
  if (!client) return null
  const db = client
  return {
    async ensureProfiles(ownerId) {
      const rows = TEAM_PROFILES.map((profile) => ({
        owner_id: ownerId,
        slug: profile.slug,
        title: profile.title,
        prompt: profile.prompt,
        tool_allow_list: [...profile.tools],
        autonomy: profile.autonomy,
        monthly_budget_cents: profile.monthlyBudgetCents,
        daily_token_cap: profile.dailyTokenCap,
        per_run_token_cap: profile.perRunTokenCap,
      }))
      const { error } = await db.from("agent_profiles").upsert(rows, { onConflict: "owner_id,slug", ignoreDuplicates: true })
      fail(error)
    },
    async profile(ownerId, slug) {
      const { data, error } = await db.from("agent_profiles").select("slug,paused,pause_reason").eq("owner_id", ownerId).eq("slug", slug).maybeSingle()
      fail(error)
      if (!data || !isTeamSlug(text(data, "slug"))) return null
      return { slug, paused: data.paused === true, pauseReason: text(data, "pause_reason") || null }
    },
    async setPaused(ownerId, slug, paused, reason) {
      const { error } = await db.from("agent_profiles").update({ paused, pause_reason: reason, updated_at: new Date().toISOString() }).eq("owner_id", ownerId).eq("slug", slug)
      fail(error)
    },
    async pauseAll(ownerId, reason) {
      const { error } = await db.from("agent_profiles").update({ paused: true, pause_reason: reason, updated_at: new Date().toISOString() }).eq("owner_id", ownerId)
      fail(error)
    },
    async findByIdempotency(ownerId, key) {
      const { data, error } = await db.from("agent_runs").select("*").eq("owner_id", ownerId).eq("idempotency_key", key).maybeSingle()
      fail(error)
      return data ? mapRun(data) : null
    },
    async createRun(row) {
      const task = await db.from("specialist_tasks").insert({
        owner_id: row.ownerId,
        role: row.slug,
        status: row.status === "running" ? "running" : "queued",
        brief: row.brief.goal,
        priority: row.priority ?? 0,
        due_at: row.dueAt ?? null,
        idempotency_key: row.idempotencyKey,
      }).select("id").single()
      fail(task.error)
      const inserted = await db.from("agent_runs").insert({
        owner_id: row.ownerId,
        agent_slug: row.slug,
        status: row.status,
        brief: row.brief,
        idempotency_key: row.idempotencyKey,
        parent_run_id: row.parentRunId,
        task_id: task.data?.id ?? null,
      }).select("*").single()
      fail(inserted.error)
      return mapRun(inserted.data ?? {}) as StoredRun
    },
    async updateRun(id, patch) {
      const current = await db.from("agent_runs").select("task_id").eq("id", id).maybeSingle()
      fail(current.error)
      const { error } = await db.from("agent_runs").update({
        ...(patch.status ? { status: patch.status, finished_at: ["done", "failed", "review", "paused", "cancelled"].includes(patch.status) ? new Date().toISOString() : null } : {}),
        ...(patch.tokensIn !== undefined ? { tokens_in: patch.tokensIn } : {}),
        ...(patch.tokensOut !== undefined ? { tokens_out: patch.tokensOut } : {}),
        ...(patch.costMicroUsd !== undefined ? { cost_micro_usd: patch.costMicroUsd } : {}),
        ...(patch.error !== undefined ? { error: patch.error } : {}),
      }).eq("id", id)
      fail(error)
      const taskId = text(current.data ?? {}, "task_id")
      if (taskId && patch.status) {
        const status = patch.status === "failed" ? "failed" : patch.status === "paused" || patch.status === "cancelled" ? "cancelled" : patch.status === "running" || patch.status === "queued" ? patch.status : "done"
        const { error: taskError } = await db.from("specialist_tasks").update({
          status,
          error: patch.error ?? null,
          finished_at: status === "done" || status === "failed" || status === "cancelled" ? new Date().toISOString() : null,
        }).eq("id", taskId)
        fail(taskError)
      }
    },
    async usageSince(ownerId, slug, dayStartIso, monthStartIso) {
      const pageSize = 1000
      let from = 0
      let dayTokens = 0
      let agentMonthMicro = 0
      let totalMonthMicro = 0
      for (;;) {
        const { data, error } = await db.from("agent_runs").select("agent_slug,tokens_in,tokens_out,cost_micro_usd,created_at").eq("owner_id", ownerId).gte("created_at", monthStartIso).order("created_at", { ascending: true }).range(from, from + pageSize - 1)
        fail(error)
        const rows = data ?? []
        for (const row of rows) {
          const cost = Number(row.cost_micro_usd) || 0
          totalMonthMicro += cost
          if (row.agent_slug === slug) agentMonthMicro += cost
          if (row.agent_slug === slug && text(row, "created_at") >= dayStartIso) dayTokens += (Number(row.tokens_in) || 0) + (Number(row.tokens_out) || 0)
        }
        if (rows.length < pageSize) break
        from += pageSize
      }
      return { dayTokens, agentMonthMicro, totalMonthMicro }
    },
    async addArtifact(row) {
      const { data, error } = await db.from("agent_artifacts").insert({
        owner_id: row.ownerId,
        run_id: row.runId,
        agent_slug: row.slug,
        kind: row.kind,
        title: row.title,
        body: row.body,
        status: row.status,
      }).select("id").single()
      fail(error)
      return { ...row, id: text(data ?? {}, "id") }
    },
    async addApproval(row) {
      const { data, error } = await db.from("agent_approvals").insert({
        owner_id: row.ownerId,
        actor_id: row.actorId,
        run_id: row.runId,
        tool: row.tool,
        target: row.target,
        params: row.params,
        params_hash: row.paramsHash,
        effect: row.effect,
        status: row.status ?? "pending",
        expires_at: row.expiresAt,
      }).select("id").single()
      fail(error)
      return { ...row, id: text(data ?? {}, "id"), status: row.status ?? "pending" }
    },
    async getApproval(ownerId, id) {
      const { data, error } = await db.from("agent_approvals").select("*").eq("owner_id", ownerId).eq("id", id).maybeSingle()
      fail(error)
      if (!data) return null
      return mapApproval(data)
    },
    async claimApproval(ownerId, id, actorId, nowIso) {
      const { data, error } = await db.from("agent_approvals").update({ status: "approved", decided_at: nowIso }).eq("owner_id", ownerId).eq("id", id).eq("actor_id", actorId).eq("status", "pending").gt("expires_at", nowIso).select("*").maybeSingle()
      fail(error)
      return data ? mapApproval(data) : null
    },
    async updateApproval(id, patch) {
      const { error } = await db.from("agent_approvals").update({
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.decidedAt ? { decided_at: patch.decidedAt } : {}),
      }).eq("id", id)
      fail(error)
    },
    async listRuns(ownerId) {
      const { data, error } = await db.from("agent_runs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(80)
      fail(error)
      return (data ?? []).map((row) => mapRun(row)).filter((row): row is StoredRun => Boolean(row))
    },
    async listApprovals(ownerId) {
      const { data, error } = await db.from("agent_approvals").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(80)
      fail(error)
      return (data ?? []).map((row) => mapApproval(row))
    },
    async listArtifacts(ownerId) {
      const { data, error } = await db.from("agent_artifacts").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(80)
      fail(error)
      return (data ?? []).map((row) => mapArtifact(row)).filter((row): row is StoredArtifact => Boolean(row))
    },
    async listProfiles(ownerId) {
      const { data, error } = await db.from("agent_profiles").select("slug,paused,pause_reason").eq("owner_id", ownerId)
      fail(error)
      return (data ?? []).flatMap((row) => {
        const slug = text(row, "slug")
        if (!isTeamSlug(slug)) return []
        return [{ slug, paused: row.paused === true, pauseReason: text(row, "pause_reason") || null }]
      })
    },
    async addHandoff(row) {
      const { data, error } = await db.from("muse_handoffs").insert({
        owner_id: row.ownerId,
        goal: row.goal,
        audience: row.audience,
        brand_voice: row.brandVoice,
        assets: row.assets,
        constraints: row.constraints,
        deadline: row.deadline,
        approval_needs: row.approvalNeeds,
        success_metric: row.successMetric,
        brief_text: row.briefText,
        status: "open",
      }).select("id").single()
      fail(error)
      return { ...row, id: text(data ?? {}, "id"), status: "open", museResult: null, avaReview: null }
    },
    async listHandoffs(ownerId, status) {
      let query = db.from("muse_handoffs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40)
      if (status) query = query.eq("status", status)
      const { data, error } = await query
      fail(error)
      return (data ?? []).map((row) => mapHandoff(row))
    },
    async getHandoff(ownerId, id) {
      const { data, error } = await db.from("muse_handoffs").select("*").eq("owner_id", ownerId).eq("id", id).maybeSingle()
      fail(error)
      return data ? mapHandoff(data) : null
    },
    async updateHandoff(id, patch) {
      const { error } = await db.from("muse_handoffs").update({
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.museResult !== undefined ? { muse_result: patch.museResult } : {}),
        ...(patch.avaReview !== undefined ? { ava_review: patch.avaReview } : {}),
        updated_at: new Date().toISOString(),
      }).eq("id", id)
      fail(error)
    },
    async listKpis(ownerId) {
      const { data, error } = await db.from("traffic_kpis").select("source,metric,value,period_start,period_end").eq("owner_id", ownerId).order("period_start", { ascending: false }).limit(200)
      fail(error)
      return (data ?? []).map((row) => ({
        source: text(row, "source"),
        metric: text(row, "metric"),
        value: Number(row.value),
        periodStart: text(row, "period_start"),
        periodEnd: text(row, "period_end"),
      })).filter((row) => Number.isFinite(row.value))
    },
    async addKpis(ownerId, rows) {
      if (!rows.length) return 0
      const { error } = await db.from("traffic_kpis").upsert(rows.map((row) => ({
        owner_id: ownerId,
        source: row.source,
        metric: row.metric,
        value: row.value,
        period_start: row.periodStart,
        period_end: row.periodEnd,
      })), { onConflict: "owner_id,source,period_start,period_end,metric" })
      fail(error)
      return rows.length
    },
    async queuedRuns(limit) {
      const { data, error } = await db.from("agent_runs").select("*").eq("status", "queued").order("created_at", { ascending: true }).limit(limit)
      fail(error)
      return (data ?? []).map((row) => mapRun(row)).filter((row): row is StoredRun => Boolean(row))
    },
    async claimRun(id) {
      const { data, error } = await db.from("agent_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", id).eq("status", "queued").select("*").maybeSingle()
      fail(error)
      return data ? mapRun(data) : null
    },
  }
}

function mapApproval(row: Row): StoredApproval {
  const params = row.params && typeof row.params === "object" ? row.params as Record<string, unknown> : {}
  return {
    id: text(row, "id"),
    ownerId: text(row, "owner_id"),
    actorId: text(row, "actor_id"),
    runId: text(row, "run_id") || null,
    tool: text(row, "tool"),
    target: text(row, "target"),
    params,
    paramsHash: text(row, "params_hash"),
    effect: text(row, "effect") as StoredApproval["effect"],
    status: text(row, "status") as StoredApproval["status"],
    expiresAt: text(row, "expires_at"),
  }
}

function mapArtifact(row: Row): StoredArtifact | null {
  const slug = text(row, "agent_slug")
  if (!isTeamSlug(slug)) return null
  return {
    id: text(row, "id"),
    runId: text(row, "run_id") || null,
    ownerId: text(row, "owner_id"),
    slug,
    kind: text(row, "kind"),
    title: text(row, "title"),
    body: text(row, "body"),
    status: text(row, "status") as StoredArtifact["status"],
  }
}

function mapHandoff(row: Row): StoredHandoff {
  return {
    id: text(row, "id"),
    ownerId: text(row, "owner_id"),
    goal: text(row, "goal"),
    audience: text(row, "audience"),
    brandVoice: text(row, "brand_voice"),
    assets: Array.isArray(row.assets) ? row.assets.filter((item): item is string => typeof item === "string") : [],
    constraints: text(row, "constraints"),
    deadline: text(row, "deadline"),
    approvalNeeds: text(row, "approval_needs"),
    successMetric: text(row, "success_metric"),
    briefText: text(row, "brief_text"),
    status: text(row, "status") as StoredHandoff["status"],
    museResult: text(row, "muse_result") || null,
    avaReview: text(row, "ava_review") || null,
  }
}

export type { StoredProfile, TeamSlug }
