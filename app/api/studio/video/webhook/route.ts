import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenText } from "@/lib/ava/speech"
import { handleVideoRequest } from "@/lib/video/handle"
import { readHeygenPayload } from "@/lib/video/heygen"
import { ffmpegAvailable, renderWithFfmpeg } from "@/lib/video/ffmpeg-render"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const tools = { omitBannedLine, spokenText }

export async function POST(request: Request) {
  const url = new URL(request.url)
  const payload = await request.json().catch(() => null)
  const parsed = readHeygenPayload(payload)
  const callback = parsed.callbackId.split(":")
  const jobId = callback[0] || ""
  const shotId = callback[1] || ""
  const ready = await ffmpegAvailable()
  const result = await handleVideoRequest({
    action: "vendor-event",
    payload: {
      token: url.searchParams.get("token") || "",
      jobId,
      shotId,
      providerId: parsed.videoId,
      status: parsed.status,
      url: parsed.videoUrl,
      error: parsed.errorMessage,
    },
    env: process.env,
    tools,
    app: "studio",
    editorReady: async () => (ready.ok ? { ok: true } : { ok: false, reason: ready.reason }),
    render: renderWithFfmpeg,
  })
  return NextResponse.json(result.body, { status: result.status })
}
