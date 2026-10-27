import { NextResponse } from "next/server"
import { betaInviteAccepted } from "@/lib/beta/invite"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { deliverSeat, sendStudioInvite } from "@/lib/seats/deliver"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`beta:${clientIp(request)}`, 8)) {
    return NextResponse.json({ error: "Too many tries. Wait a minute and try again." }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Send a JSON object." }, { status: 400 })
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : ""
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a real email address." }, { status: 400 })
  if (record.consent !== true) {
    return NextResponse.json({ error: "Check the box to join the beta." }, { status: 400 })
  }
  if (!betaInviteAccepted(record.inviteCode)) {
    return NextResponse.json({ error: "That invite code is not valid." }, { status: 403 })
  }

  const admin = createSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: "Beta signup is not configured yet." }, { status: 503 })

  const { data: existing } = await admin
    .from("seats")
    .select("id, source, status, is_beta")
    .eq("email", email)
    .in("status", ["pending", "active"])
    .maybeSingle()

  const paid = existing?.source === "paypal" || (existing?.source === "manual" && existing.status === "active" && !existing.is_beta)
  if (!paid) {
    const delivered = await deliverSeat({
      email,
      source: "beta",
      planKey: "monthly",
      sendInvite: false,
    })
    if (!delivered.ok) return NextResponse.json({ error: "Could not reserve the beta seat." }, { status: 500 })
    await admin.from("seats").update({ beta_consent_at: new Date().toISOString(), is_beta: true }).eq("id", delivered.seatId)
  }

  const invited = await sendStudioInvite(email)
  if (!invited) {
    return NextResponse.json({ error: "The seat is reserved, but the sign-in email did not send. Try again in a minute." }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
