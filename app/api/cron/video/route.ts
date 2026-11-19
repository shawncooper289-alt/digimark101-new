import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenText } from "@/lib/ava/speech"
import { handleVideoRequest } from "@/lib/video/handle"
import { ffmpegAvailable, renderWithFfmpeg } from "@/lib/video/ffmpeg-render"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const header = request.headers.get("authorization")
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const ready = await ffmpegAvailable()
  const result = await handleVideoRequest({
    action: "sweep",
    payload: {},
    env: process.env,
    tools: { omitBannedLine, spokenText },
    app: "studio",
    editorReady: async () => (ready.ok ? { ok: true } : { ok: false, reason: ready.reason }),
    render: renderWithFfmpeg,
  })
  return Response.json(result.body, { status: result.status })
}
