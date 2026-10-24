import { officeConfig, supabaseKeyHeaders } from "@/lib/office-store"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLANS = new Set(["starter", "monthly", "quarterly", "semiannual"])

export function studioInviteOrigin() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.digimark101.com").trim()
  try {
    return new URL(raw).origin
  } catch {
    return "https://www.digimark101.com"
  }
}

export async function grantSeat(input: { email: string; planKey: string; grantedBy: string }) {
  const { url, service } = officeConfig()
  const email = input.email.trim().toLowerCase()
  const planKey = PLANS.has(input.planKey) ? input.planKey : "monthly"
  if (!url || !service) return { ok: false as const, error: "SUPABASE_SERVICE_ROLE_KEY is not set on the office." }
  if (!EMAIL.test(email)) return { ok: false as const, error: "Add a valid email." }
  await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, email_confirm: true }),
    cache: "no-store",
  }).catch(() => null)
  const saved = await fetch(`${url}/rest/v1/rpc/deliver_seat`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      seat_email: email,
      seat_plan: planKey,
      seat_source: "manual",
      seat_user: null,
      seat_paypal: null,
      seat_granted_by: input.grantedBy,
    }),
    cache: "no-store",
  })
  const data = (await saved.json().catch(() => null)) as { ok?: boolean; error?: string; email?: string; seat_id?: string; status?: string } | null
  if (!saved.ok || !data?.ok) {
    const detail = data?.error || "The seat was not saved. Apply supabase/migrations/20261025_seats.sql."
    return { ok: false as const, error: detail }
  }
  const invite = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      email: data.email || email,
      create_user: true,
      options: { emailRedirectTo: `${studioInviteOrigin()}/auth/callback` },
    }),
    cache: "no-store",
  })
  if (invite.ok && data.seat_id) {
    await fetch(`${url}/rest/v1/seats?id=eq.${data.seat_id}`, {
      method: "PATCH",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({ invite_sent_at: new Date().toISOString() }),
      cache: "no-store",
    }).catch(() => null)
  }
  return { ok: true as const, invited: invite.ok, status: data.status || "pending" }
}
