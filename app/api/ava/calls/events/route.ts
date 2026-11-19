import { NextResponse } from "next/server"
import { callFacts, readElevenLabsEvent } from "@/lib/ava/phone"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** ElevenLabs post-call webhook. The raw body is verified before it is trusted. */
export async function POST(request: Request) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET?.trim() || ""
  const raw = await request.text()
  const checked = readElevenLabsEvent(raw, request.headers.get("elevenlabs-signature"), secret)
  if (!checked.ok) {
    const status = checked.error === "Phone calling is not connected." ? 503 : 401
    return NextResponse.json({ error: checked.error }, { status })
  }

  const facts = callFacts(checked.event)
  const admin = createSupabaseAdmin()
  if (admin && facts.ids.length && facts.duration !== null) {
    const ended = new Date().toISOString()
    for (const id of facts.ids) {
      const { error } = await admin
        .from("ava_voice_calls")
        .update({ duration_seconds: facts.duration, ended_at: ended })
        .eq("call_sid", id)
      if (error) console.error("Ava call log failed")
    }
  }

  return NextResponse.json({ received: true })
}
