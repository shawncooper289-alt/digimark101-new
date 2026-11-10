import { NextResponse } from "next/server"
import { synthesizeSpeech } from "@/lib/ava-tts"

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
  return current.count > 24
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

function browserSpeech() {
  return new NextResponse(null, {
    status: 204,
    headers: { "X-Ava-Speech": "browser", "Cache-Control": "no-store" },
  })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooMany(clientIp(request))) return browserSpeech()
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null
  const text = typeof body?.text === "string" ? body.text : ""
  if (!text.trim()) return NextResponse.json({ error: "Nothing to say." }, { status: 400 })
  const audio = await synthesizeSpeech(text)
  if (!audio) return browserSpeech()
  return new NextResponse(audio.audio, {
    headers: {
      "Content-Type": audio.contentType,
      "Cache-Control": "no-store",
      "X-Ava-Speech": audio.provider,
    },
  })
}
