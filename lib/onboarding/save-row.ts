import type { SupabaseClient } from "@supabase/supabase-js"
import { isNoRoadblock, NO_ROADBLOCK_NOTE, starterGrowthPlan } from "@/lib/onboarding/growth-plan"

type RowError = { message?: string; code?: string } | null

export function isMissingSetupColumn(error: RowError) {
  if (!error) return false
  const message = `${error.message ?? ""}`.toLowerCase()
  const code = error.code ?? ""
  return code === "PGRST204" || code === "42703" || message.includes("main_roadblock") || message.includes("growth_plan")
}

/** Keeps a first growth plan even when the new columns are not on the database yet. */
function foldPlanIntoGoals(row: Record<string, unknown>, fields: Record<string, string>) {
  const plan = fields.growth_plan?.trim()
  const roadblock = fields.main_roadblock?.trim()
  if (!plan && !roadblock) return row
  const goal = typeof row.goals === "string" ? row.goals.trim() : ""
  if (goal.includes("First growth plan:")) return row
  const extra = [roadblock ? `What's slowing things down: ${roadblock}` : "", plan ? `First growth plan: ${plan}` : ""]
    .filter(Boolean)
    .join("\n\n")
  return { ...row, goals: [goal, extra].filter(Boolean).join("\n\n").slice(0, 2000) }
}

export function withGrowthPlan(fields: Record<string, string>) {
  const next = { ...fields }
  if (next.main_roadblock && isNoRoadblock(next.main_roadblock)) next.main_roadblock = NO_ROADBLOCK_NOTE
  if (!next.growth_plan?.trim()) {
    next.growth_plan = starterGrowthPlan({
      business: next.business_name,
      customer: next.target_customer,
      sources: next.lead_sources,
      goal: next.goals,
      offer: next.offer,
      website: next.business_website,
      roadblock: next.main_roadblock,
    })
  }
  return next
}

export async function upsertClientOnboarding(
  supabase: SupabaseClient,
  userId: string,
  fields: Record<string, string>,
  options?: { complete?: boolean },
) {
  const row: Record<string, unknown> = {
    user_id: userId,
    ...fields,
    updated_at: new Date().toISOString(),
  }
  if (options?.complete) row.onboarding_complete = true
  const first = await supabase.from("client_onboarding").upsert(row, { onConflict: "user_id" }).select().single()
  if (!first.error || !isMissingSetupColumn(first.error)) return first
  const fallback = foldPlanIntoGoals({ ...row }, fields)
  delete fallback.main_roadblock
  delete fallback.growth_plan
  return supabase.from("client_onboarding").upsert(fallback, { onConflict: "user_id" }).select().single()
}
