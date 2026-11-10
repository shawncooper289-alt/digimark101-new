import { NextResponse } from "next/server"
import { avaIntroScript } from "@/lib/ava/intro"
import { synthesizeSpeech } from "@/lib/ava/tts"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function browserSpeech() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "X-Ava-Speech": "browser",
      "Cache-Control": "no-store",
    },
  })
}

export async function GET(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  }
  if (tooManyRequests(`intro:${clientIp(request)}`, 8)) return browserSpeech()
  const audio = await synthesizeSpeech(avaIntroScript)
  if (!audio) return browserSpeech()
  return new NextResponse(audio.audio, {
    headers: {
      "Content-Type": audio.contentType,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Ava-Speech": audio.provider,
    },
  })
}
