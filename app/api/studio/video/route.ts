import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { spokenText } from "@/lib/ava/speech"
import { handleVideoRequest } from "@/lib/video/handle"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { commitAction } from "@/lib/platform/db"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const tools = { omitBannedLine, spokenText }

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
  if (action === "handoff") {
    const { supabase, user } = await currentUser()
    if (!supabase || !user) {
      return NextResponse.json({ error: "Sign in to put this on the schedule. Nothing was posted." }, { status: 401 })
    }
    const result = await handleVideoRequest({ action, payload, env: process.env, tools })
    if (result.status !== 200 || typeof result.body.caption !== "string" || typeof result.body.platform !== "string") {
      return NextResponse.json(result.body, { status: result.status })
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
  const result = await handleVideoRequest({ action, payload, env: process.env, tools })
  return NextResponse.json(result.body, { status: result.status })
}
