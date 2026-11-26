import { isTeamSlug } from "@/lib/ava/team/profiles"
import { startTeamRun } from "@/lib/ava/team/server-run"
import { isOwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { user } = await currentUser()
  if (!isOwnerIdentity(user) || !user?.id) {
    return Response.json({ error: "Only the owner can run the team." }, { status: 403 })
  }
  const { slug } = await params
  if (!isTeamSlug(slug)) return Response.json({ error: "That agent is not on the team." }, { status: 404 })
  const admin = createSupabaseAdmin()
  if (!admin) return Response.json({ error: "The server key is not set. Nothing was run." }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {}
  const result = await startTeamRun({
    ownerId: user.id,
    actorId: user.id,
    slug,
    brief: record,
    idempotencyKey: typeof record.idempotencyKey === "string" ? record.idempotencyKey : undefined,
    supabase: admin,
  })
  return Response.json(result, { status: result.ok ? 200 : result.migration ? 503 : 400 })
}
