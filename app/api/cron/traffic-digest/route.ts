import { cronAuthorized } from "@/lib/cron/auth"
import { digestSources, trafficDigest } from "@/lib/ava/team/digest"
import { missingReadSources } from "@/lib/ava/team/providers"
import { pullTrafficKpis, startTeamRun } from "@/lib/ava/team/server-run"
import { supabaseTeamStore } from "@/lib/ava/team/supabase-store"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const ownerId = process.env.MUSE_OWNER_USER_ID?.trim() || process.env.LEAD_OWNER_USER_ID?.trim() || ""
  const admin = createSupabaseAdmin()
  const store = admin ? supabaseTeamStore(admin) : null
  if (!ownerId || !admin || !store) {
    return Response.json({ ok: false, reason: "Set LEAD_OWNER_USER_ID and the server key. No digest was invented." }, { status: 503 })
  }
  const pulled = await pullTrafficKpis(ownerId, store).catch(() => 0)
  const kpis = await store.listKpis(ownerId).catch(() => [])
  const missing = missingReadSources()
  const note = trafficDigest({ kpis, missing })
  const day = new Date().toISOString().slice(0, 10)
  const result = await startTeamRun({
    ownerId,
    actorId: ownerId,
    slug: "traffic",
    brief: { goal: `Weekly traffic digest for ${day}. ${note}` },
    idempotencyKey: `traffic-digest-${day}`,
    supabase: admin,
    store,
    extraSources: digestSources(kpis),
  })
  return Response.json({ ok: result.ok, pulled, missing, status: result.status, text: result.text })
}
