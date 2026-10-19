import { createSupabaseAdmin } from "@/lib/supabase/admin"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type OwnerIdentity = { id?: string | null; email?: string | null }

export function ownerEmail() {
  return ownerEmails()[0] || ""
}

export function ownerEmails() {
  return (process.env.OWNER_EMAIL || "")
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function isOwnerIdentity(user: OwnerIdentity | null) {
  if (!user) return false
  const configuredId = process.env.LEAD_OWNER_USER_ID?.trim()
  if (configuredId && user.id && user.id === configuredId) return true
  const email = user.email?.trim().toLowerCase() || ""
  return Boolean(email && ownerEmails().includes(email))
}

export function isWorkspaceId(value: string | null | undefined): value is string {
  return Boolean(value && UUID.test(value))
}

export async function ensureOwnerGranted(user: OwnerIdentity | null) {
  if (!isOwnerIdentity(user) || !user?.id) return false
  const admin = createSupabaseAdmin()
  const email = ownerEmail()
  if (!admin || !email) return true
  try {
    const { error: syncError } = await admin.rpc("sync_owner_email", { owner_email: email })
    if (syncError) {
      const { data } = await admin.auth.admin.getUserById(user.id)
      const current = data.user?.app_metadata
      if (current?.role !== "owner") {
        await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...current, role: "owner" } })
      }
    }
  } catch {
    // The session still counts as owner from OWNER_EMAIL. The role stamp retries on the next request.
  }
  return true
}

export async function listWorkspaces(self: { id: string }) {
  const admin = createSupabaseAdmin()
  const own = { id: self.id, label: "Your workspace" }
  if (!admin) return [own]
  const found: { id: string; label: string }[] = []
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) break
    for (const account of data.users) {
      const name = typeof account.user_metadata?.full_name === "string" ? account.user_metadata.full_name.trim() : ""
      found.push({
        id: account.id,
        label: account.id === self.id ? "Your workspace" : name || account.email || `Workspace ${account.id.slice(0, 8)}`,
      })
    }
    if (data.users.length < 200) break
  }
  if (!found.some((item) => item.id === self.id)) found.unshift(own)
  return found
}
