import { NextResponse } from "next/server"
import { decideOutboundCall, logId, placeOutboundCall } from "@/lib/ava/phone"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { isOwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  if (await tooManyRequests(`call:${clientIp(request)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many call attempts. Wait a few minutes." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const { user } = await currentUser()
  const decision = decideOutboundCall({ env: process.env, owner: isOwnerIdentity(user), body })
  if (!decision.ok) return NextResponse.json(decision.body, { status: decision.status })
  if (decision.kind === "unconfigured") return NextResponse.json(decision.body)

  const placed = await placeOutboundCall(decision)
  if (!placed.ok) return NextResponse.json({ error: placed.error }, { status: 502 })

  const admin = createSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from("ava_voice_calls").insert({
      ...(user?.id ? { user_id: user.id } : {}),
      call_sid: logId(placed.callSid, placed.conversationId),
      direction: "outbound",
      phone_number: decision.to,
      started_at: new Date().toISOString(),
    })
    if (error) console.error("Ava call log failed")
  }

  return NextResponse.json({
    success: true,
    channel: "phone",
    callSid: placed.callSid,
    conversationId: placed.conversationId,
    note: "Ava is calling that number now.",
  })
}
