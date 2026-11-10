import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { authFetch } from "@/lib/auth-fetch"
import { pkceCookieOptions } from "@/lib/pkce"
import { encodeOfficeSession, isOwnerIdentity, officeConfig, officeCookieOptions, ownerEmails, supabaseKeyHeaders } from "@/lib/office-store"

const VERIFIER = "ava_pkce"

export async function POST(request: Request) {
  const { url, anon, emails, service } = officeConfig()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { code?: string } | null
  const code = body?.code || ""
  const jar = await cookies()
  const verifier = jar.get(VERIFIER)?.value || ""
  jar.set(VERIFIER, "", { ...pkceCookieOptions(), maxAge: 0 })
  if (!code || code.length > 2048 || !verifier) {
    return NextResponse.json({ error: "Login link expired. Request a new one." }, { status: 401 })
  }
  const response = await authFetch(`${url}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  })
  if (response.status >= 500) {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  if (!response.ok) {
    return NextResponse.json({ error: "Login link expired. Request a new one." }, { status: 401 })
  }
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number }
  if (!data.access_token || !data.refresh_token) {
    return NextResponse.json({ error: "Not an owner mailbox." }, { status: 403 })
  }
  const userResponse = await authFetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${data.access_token}` },
  })
  if (userResponse.status >= 500) {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  const user = userResponse.ok
    ? ((await userResponse.json()) as { email?: string; app_metadata?: { role?: string } })
    : null
  const email = user?.email?.trim().toLowerCase() || ""
  if (!isOwnerIdentity(email, user?.app_metadata?.role)) {
    return NextResponse.json({ error: "Not an owner mailbox." }, { status: 403 })
  }
  jar.set(
    "ava_office",
    encodeOfficeSession(data.access_token, data.refresh_token, data.expires_in || 3600),
    officeCookieOptions(data.expires_in || 3600),
  )
  if (service && ownerEmails().includes(email)) {
    await authFetch(`${url}/rest/v1/rpc/sync_owner_email`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({ owner_email: email }),
    }).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}
