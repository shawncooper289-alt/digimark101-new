import { connectorAuthorized, connectorOwnerId } from "@/lib/ava/team/connector"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { TeamMigrationNeeded } from "@/lib/ava/team/store"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!connectorAuthorized(request.headers.get("authorization"), process.env.MUSE_CONNECTOR_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const ownerId = connectorOwnerId(process.env)
  const store = supabaseTeamStore()
  if (!ownerId || !store) return Response.json({ error: "The connector owner is not configured." }, { status: 503 })
  try {
    const briefs = await store.listHandoffs(ownerId, "open")
    return Response.json({
      briefs: briefs.map((item) => ({
        id: item.id,
        goal: item.goal,
        audience: item.audience,
        brandVoice: item.brandVoice,
        assets: item.assets,
        constraints: item.constraints,
        deadline: item.deadline,
        approvalNeeds: item.approvalNeeds,
        successMetric: item.successMetric,
        briefText: item.briefText,
      })),
    })
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return Response.json({ error: error.message }, { status: 503 })
    throw error
  }
}
