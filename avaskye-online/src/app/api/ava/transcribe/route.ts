import { NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/ava/transcribe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const hits = new Map<string, { count: number; started: number }>()

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

function tooMany(ip: string) {
  const now = Date.now()
  const current = hits.get(ip)
  if (!current || now - current.started > 60_000) {
    hits.set(ip, { count: 1, started: now })
    return false
  }
  current.count += 1
  return current.count > 16
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooMany(clientIp(request))) {
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
