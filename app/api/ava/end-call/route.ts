import { NextResponse } from "next/server"
import { decideEndCall, hangUpCall } from "@/lib/ava/phone"
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
  if (await tooManyRequests(`end-call:${clientIp(request)}`, 6, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many call attempts. Wait a few minutes." }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as { callSid?: unknown; conversationId?: unknown } | null
  const { user } = await currentUser()
  const decision = decideEndCall({ env: process.env, owner: isOwnerIdentity(user), callSid: body?.callSid })
  if (!decision.ok) return NextResponse.json(decision.body, { status: decision.status })
  if (decision.kind === "unconfigured") return NextResponse.json(decision.body)

  const ended = await hangUpCall(decision)
  if (!ended.ok) return NextResponse.json({ error: ended.error }, { status: 502 })

  const admin = createSupabaseAdmin()
  if (admin) {
    const { error } = await admin
      .from("ava_voice_calls")
      .update({ ended_at: new Date().toISOString() })
      .eq("call_sid", typeof body?.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim().slice(0, 80) : decision.callSid)
    if (error) console.error("Ava call log failed")
  }

  return NextResponse.json({ success: true, channel: "phone", note: "The call was ended." })
}
