import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { readAuthError } from "@/lib/auth-failure"
import { authFetch } from "@/lib/auth-fetch"
import { missingOfficeAuthEnv } from "@/lib/office-redirect"
import { encodeOfficeSession, isOwnerIdentity, officeConfig, officeCookieOptions, officeSignInAllowed, ownerEmails, supabaseKeyHeaders } from "@/lib/office-store"

const COOKIE = "ava_office"

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

export async function POST(request: Request) {
  if (!officeSignInAllowed(clientIp(request))) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 })
  }
  const { url, anon, emails } = officeConfig()
  const missing = missingOfficeAuthEnv()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: `Owner sign-in is missing ${missing.join(", ") || "Supabase settings"}.` }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  if (!email || !password) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const response = await authFetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    const failure = await readAuthError(response)
    console.warn("office_password_auth_rejected", { status: response.status, category: failure.status })
    return NextResponse.json({ error: failure.error }, { status: failure.status })
  }
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number }
  if (!data.access_token || !data.refresh_token) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const userResponse = await authFetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${data.access_token}` },
  })
  if (userResponse.status >= 500) {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  const user = userResponse.ok
    ? (await userResponse.json()) as { email?: string; app_metadata?: { role?: string } }
    : null
  const signedIn = user?.email?.trim().toLowerCase() || ""
  if (!isOwnerIdentity(signedIn, user?.app_metadata?.role)) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const jar = await cookies()
  jar.set(COOKIE, encodeOfficeSession(data.access_token, data.refresh_token, data.expires_in || 3600), officeCookieOptions(data.expires_in || 3600))
  const { url: projectUrl, service } = officeConfig()
  if (projectUrl && service && ownerEmails().includes(signedIn)) {
    await authFetch(`${projectUrl}/rest/v1/rpc/sync_owner_email`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({ owner_email: signedIn }),
    }).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.set(COOKIE, "", officeCookieOptions(0))
  return NextResponse.json({ ok: true })
}
