import { supabaseKeyHeaders } from "@/lib/supabase/headers"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export type SeatSource = "paypal" | "manual" | "request" | "beta"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function siteOrigin() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.digimark101.com").trim()
  try {
    return new URL(raw).origin
  } catch {
    return "https://www.digimark101.com"
  }
}

function projectUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "")
}

export async function ensureAuthUser(email: string) {
  const admin = createSupabaseAdmin()
  if (!admin || !EMAIL.test(email)) return false
  const { error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (!error) return true
  return /already|registered|exists/i.test(error.message)
}

export async function sendStudioInvite(email: string, redirectTo?: string) {
  const url = projectUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !key || !EMAIL.test(email)) return false
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: supabaseKeyHeaders(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      email,
      create_user: true,
      options: { emailRedirectTo: redirectTo || `${siteOrigin()}/auth/callback` },
    }),
    cache: "no-store",
  })
  return response.ok
}

export async function deliverSeat(input: {
  email?: string | null
  userId?: string | null
  planKey?: string | null
  source: SeatSource
  paypalSubscriptionId?: string | null
  grantedBy?: string | null
  sendInvite?: boolean
}) {
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, invited: false, error: "Supabase service role is not configured" }
  const email = (input.email || "").trim().toLowerCase()
  if (input.source !== "request" && EMAIL.test(email)) await ensureAuthUser(email)
  const { data, error } = await admin.rpc("deliver_seat", {
    seat_email: email,
    seat_plan: input.planKey || "monthly",
    seat_source: input.source,
    seat_user: input.userId || null,
    seat_paypal: input.paypalSubscriptionId || null,
    seat_granted_by: input.grantedBy || null,
  })
  if (error) return { ok: false as const, invited: false, error: error.message }
  const row = (data ?? null) as { ok?: boolean; error?: string; seat_id?: string; status?: string; user_id?: string | null; email?: string } | null
  if (!row?.ok || !row.seat_id) return { ok: false as const, invited: false, error: row?.error || "Seat was not saved" }
  const inviteEmail = (row.email || email).trim().toLowerCase()
  let invited = false
  if (input.sendInvite !== false && input.source !== "request" && EMAIL.test(inviteEmail)) {
    invited = await sendStudioInvite(inviteEmail)
    if (invited) {
      await admin.from("seats").update({ invite_sent_at: new Date().toISOString() }).eq("id", row.seat_id)
    }
  }
  return { ok: true as const, invited, seatId: row.seat_id, status: row.status || "pending", userId: row.user_id || null }
}
