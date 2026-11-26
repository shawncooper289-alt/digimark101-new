import { connectorAuthorized, connectorOwnerId } from "@/lib/ava/team/connector"
import { reviewMuseResult } from "@/lib/ava/team/muse"
import { parseBrief } from "@/lib/ava/team/brief"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { TeamMigrationNeeded } from "@/lib/ava/team/store"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!connectorAuthorized(request.headers.get("authorization"), process.env.MUSE_CONNECTOR_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const ownerId = connectorOwnerId(process.env)
  const store = supabaseTeamStore()
  if (!ownerId || !store) return Response.json({ error: "The connector owner is not configured." }, { status: 503 })
  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = body && typeof body === "object" && typeof (body as { result?: unknown }).result === "string"
    ? (body as { result: string }).result.trim().slice(0, 20000)
    : ""
  if (result.length < 2) return Response.json({ error: "A result is required." }, { status: 400 })
  try {
    const handoff = await store.getHandoff(ownerId, id)
    if (!handoff || handoff.status !== "open") return Response.json({ error: "That brief is not open." }, { status: 404 })
    const brief = parseBrief(handoff)
    const review = brief ? reviewMuseResult(result, brief) : { text: "Held. The brief could not be read. Nothing was published.", review: { pass: false, issues: ["brief"], metrics: [], delivered: [] } }
    await store.updateHandoff(id, { status: "reviewed", museResult: result, avaReview: review.text })
    return Response.json({ id, status: "reviewed", review: review.text })
  } catch (error) {
    if (error instanceof TeamMigrationNeeded) return Response.json({ error: error.message }, { status: 503 })
    throw error
  }
}
