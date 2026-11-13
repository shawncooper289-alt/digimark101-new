import { NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/ava/transcribe"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  if (tooManyRequests(`transcribe:${clientIp(request)}`, 16)) {
    return NextResponse.json({ error: "Too many voice messages. Wait a minute, or type instead." }, { status: 429 })
  }
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Send an audio recording." }, { status: 400 })
  }
  const audio = form.get("audio")
  if (!(audio instanceof File)) return NextResponse.json({ error: "Send an audio recording." }, { status: 400 })
  if (audio.size < 400) return NextResponse.json({ error: "That recording was too short." }, { status: 400 })
  if (audio.size > 8_000_000) {
    return NextResponse.json({ error: "That recording was too long. Try a shorter message." }, { status: 400 })
  }
  const result = await transcribeAudio(audio, audio.name || "speech.webm")
  if (!result) return NextResponse.json({ error: "Speech could not be transcribed." }, { status: 503 })
  return NextResponse.json({ text: result.text, provider: result.provider })
}
