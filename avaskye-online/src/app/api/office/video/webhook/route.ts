import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { AVA_IDENTITY } from "@/lib/ava/identity"
import { ffmpegAvailable, renderWithFfmpeg } from "../../../../../../../lib/video/ffmpeg-render"
import { handleVideoRequest } from "../../../../../../../lib/video/handle"
import { readHeygenPayload } from "../../../../../../../lib/video/heygen"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const tools = {
  omitBannedLine,
  spokenText: (text: string) => text.replace(/\bAva\b/g, AVA_IDENTITY.pronunciation.phoneticSpelling),
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const payload = await request.json().catch(() => null)
  const parsed = readHeygenPayload(payload)
  const callback = parsed.callbackId.split(":")
  const ready = await ffmpegAvailable()
  const result = await handleVideoRequest({
    action: "vendor-event",
    payload: {
      token: url.searchParams.get("token") || "",
      jobId: callback[0] || "",
      shotId: callback[1] || "",
      providerId: parsed.videoId,
      status: parsed.status,
      url: parsed.videoUrl,
      error: parsed.errorMessage,
    },
    env: process.env,
    tools,
    app: "office",
    editorReady: async () => (ready.ok ? { ok: true } : { ok: false, reason: ready.reason }),
    render: renderWithFfmpeg,
  })
  return NextResponse.json(result.body, { status: result.status })
}
