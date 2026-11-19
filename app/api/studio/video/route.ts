import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenText } from "@/lib/ava/speech"
import { handleVideoRequest } from "@/lib/video/handle"
import { ffmpegAvailable, renderWithFfmpeg } from "@/lib/video/ffmpeg-render"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { commitAction } from "@/lib/platform/db"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const tools = { omitBannedLine, spokenText }

function callbackBase(request: Request) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
  const proto = request.headers.get("x-forwarded-proto") || "https"
  return host ? `${proto}://${host}` : ""
}

const film = {
  editorReady: async () => {
    const ready = await ffmpegAvailable()
    return ready.ok ? { ok: true as const } : { ok: false as const, reason: ready.reason }
  },
  render: renderWithFfmpeg,
}

export async function GET(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const result = await handleVideoRequest({ action: "capabilities", payload: {}, env: process.env, tools })
  return NextResponse.json(result.body, { status: result.status })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`video:${clientIp(request)}`, 20)) {
    return NextResponse.json({ error: "Too many video requests. Wait a minute and try again." }, { status: 429 })
  }
  const payload = await request.json().catch(() => null) as { action?: unknown } | null
  const action = typeof payload?.action === "string" ? payload.action : ""
  const { user } = await currentUser().catch(() => ({ user: null }))
  const result = await handleVideoRequest({
    action,
    payload,
    env: process.env,
    tools,
    app: "studio",
    ownerId: user?.id || "",
    callbackBase: callbackBase(request),
    ...film,
  })
  if (action !== "handoff" || result.status !== 200 || typeof result.body.caption !== "string" || typeof result.body.platform !== "string") {
    return NextResponse.json(result.body, { status: result.status })
  }
  if (!user) {
    return NextResponse.json({ error: "Sign in to put this on the schedule. Nothing was posted." }, { status: 401 })
  }
  const { supabase } = await currentUser()
  if (!supabase) {
    return NextResponse.json({ error: "Sign in to put this on the schedule. Nothing was posted." }, { status: 401 })
  }
  const when = typeof result.body.scheduledFor === "string" ? result.body.scheduledFor : ""
  try {
    const saved = await commitAction(supabase, user.id, {
      type: "draft_social_post",
      platform: result.body.platform,
      body: result.body.caption,
      scheduledFor: when || undefined,
    })
    return NextResponse.json({ ...result.body, saved: saved.summary, posted: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The schedule did not save."
    return NextResponse.json({ error: message, posted: false }, { status: 503 })
  }
}
