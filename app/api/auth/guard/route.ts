import { NextResponse } from "next/server"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { TURNSTILE_REJECTED, turnstileOk } from "@/lib/security/turnstile"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { action?: unknown; turnstileToken?: unknown } | null
  const action = body?.action === "login" ? "login" : "signup"
  const ip = clientIp(request)
  if (await tooManyRequests(`${action}:${ip}`, 8)) {
    return NextResponse.json({ error: "Too many tries. Wait a minute and try again." }, { status: 429 })
  }
  if (!(await turnstileOk(body?.turnstileToken, ip))) {
    return NextResponse.json({ error: TURNSTILE_REJECTED }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
