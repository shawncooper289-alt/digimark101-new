import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { encodeOfficeSession, officeConfig, officeCookieOptions, officeSignInAllowed, supabaseKeyHeaders } from "@/lib/office-store"

const COOKIE = "ava_office"

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

export async function POST(request: Request) {
  if (!officeSignInAllowed(clientIp(request))) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 })
  }
  const { url, anon, owner } = officeConfig()
  if (!url || !anon || !owner) {
    return NextResponse.json({ error: "Owner sign-in needs Supabase configured on this server." }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email?.trim().toLowerCase() || ""
  const password = body?.password || ""
  if (!email || !password || email !== owner) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  })
  if (!response.ok) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; user?: { email?: string } }
  if (!data.access_token || !data.refresh_token || data.user?.email?.trim().toLowerCase() !== owner) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const jar = await cookies()
  jar.set(COOKIE, encodeOfficeSession(data.access_token, data.refresh_token, data.expires_in || 3600), officeCookieOptions(data.expires_in || 3600))
  const { url: projectUrl, service } = officeConfig()
  if (projectUrl && service) {
    await fetch(`${projectUrl}/rest/v1/rpc/sync_owner_email`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({ owner_email: owner }),
      cache: "no-store",
    }).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.set(COOKIE, "", officeCookieOptions(0))
  return NextResponse.json({ ok: true })
}
