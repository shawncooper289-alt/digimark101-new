import { NextResponse } from "next/server"
import { callFacts, secretsMatch } from "@/lib/ava/phone"
import { clientIp, tooManyRequests } from "@/lib/http"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * ElevenLabs calls this when someone dials Ava's Twilio number, before she speaks.
 * The header secret is the one set on the agent's initiation webhook.
 */
export async function POST(request: Request) {
  const secret = process.env.AVA_CALL_WEBHOOK_SECRET?.trim() || ""
  if (!secret) {
    return NextResponse.json({ error: "Phone calling is not connected." }, { status: 503 })
  }
  if (!secretsMatch(request.headers.get("x-ava-call-secret"), secret)) {
    return NextResponse.json({ error: "That call request was not signed." }, { status: 401 })
  }
  if (await tooManyRequests(`inbound:${clientIp(request)}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many calls. Wait a few minutes." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const facts = callFacts(body)
  if (facts.direction === "outbound") {
    return NextResponse.json({ type: "conversation_initiation_client_data" })
  }
  const caller = facts.phone
  if (caller && (await tooManyRequests(`inbound-caller:${caller}`, 5, 10 * 60_000))) {
    return NextResponse.json({ error: "Too many calls from that number. Wait a few minutes." }, { status: 429 })
  }

  const admin = createSupabaseAdmin()
  const callSid = facts.ids[0] || ""
  if (admin && callSid) {
    const { error } = await admin.from("ava_voice_calls").insert({
      call_sid: callSid,
      direction: "inbound",
      ...(caller ? { phone_number: caller } : {}),
      started_at: new Date().toISOString(),
    })
    if (error) console.error("Ava call log failed")
  }

  return NextResponse.json({ type: "conversation_initiation_client_data" })
}
