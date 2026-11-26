import { connectorAuthorized, connectorOwnerId } from "@/lib/ava/team/connector"
import { missingReadSources } from "@/lib/ava/team/providers"
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
    const metrics = await store.listKpis(ownerId)
    return Response.json({
      metrics,
      missing: missingReadSources(),
      note: "Only stored measurements. Missing sources are not filled in.",
    })
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return Response.json({ metrics: [], missing: missingReadSources(), note: error.message }, { status: 503 })
    throw error
  }
}
