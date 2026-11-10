import { NextResponse } from "next/server"
import { synthesizeSpeech } from "@/lib/ava/tts"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function browserSpeech() {
  return new NextResponse(null, {
    status: 204,
    headers: { "X-Ava-Speech": "browser", "Cache-Control": "no-store" },
  })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`speak:${clientIp(request)}`, 24)) return browserSpeech()
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
