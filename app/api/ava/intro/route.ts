import { NextResponse } from "next/server"
import { avaIntroScript } from "@/lib/ava/intro"
import { spokenSsml, spokenText } from "@/lib/ava/speech"
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

  const key = process.env.AVA_TTS_API_KEY?.trim()
  if (!key) return browserSpeech()

  const base = (process.env.AVA_TTS_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  const model = process.env.AVA_TTS_MODEL?.trim() || "tts-1"
  const voice = process.env.AVA_TTS_VOICE?.trim() || "nova"

  try {
    const response = await fetch(`${base}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        input: process.env.AVA_TTS_SSML === "true" ? spokenSsml(avaIntroScript) : spokenText(avaIntroScript),
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) return browserSpeech()
    const audio = await response.arrayBuffer()
    if (audio.byteLength < 64) return browserSpeech()
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "X-Ava-Speech": "file",
      },
    })
  } catch {
    return browserSpeech()
  }
}
