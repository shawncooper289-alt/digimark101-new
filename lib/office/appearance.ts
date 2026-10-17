import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { isOwnerIdentity, type OwnerIdentity } from "@/lib/owner/access"

export async function setOwnerVisitorMode(user: OwnerIdentity | null, visitorMode: boolean) {
  if (!isOwnerIdentity(user) || !user?.id) {
    return { ok: false as const, error: "Visitor mode is an owner office control." }
  }
  const admin = createSupabaseAdmin()
  if (!admin) {
    return { ok: false as const, error: "The founder office could not save visitor mode because Supabase is not configured on the server." }
  }
  const { error } = await admin.from("owner_office_appearance").upsert(
    { owner_id: user.id, visitor_mode: visitorMode, updated_at: new Date().toISOString() },
    { onConflict: "owner_id" },
  )
  if (error) {
    return { ok: false as const, error: "The founder office could not save visitor mode." }
  }
  return { ok: true as const }
}
