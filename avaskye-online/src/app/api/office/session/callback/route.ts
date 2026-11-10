import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { authFetch } from "@/lib/auth-fetch"
import { encodeOfficeSession, isOwnerIdentity, officeConfig, officeCookieOptions, ownerEmails, supabaseKeyHeaders } from "@/lib/office-store"

export async function POST(request: Request) {
  const { url, anon, emails, service } = officeConfig()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  } | null
  const access = body?.access_token || ""
  const refresh = body?.refresh_token || ""
  const expiresIn = body?.expires_in || 3600
  if (!access || !refresh) {
    return NextResponse.json({ error: "Missing tokens." }, { status: 400 })
  }
  const userResponse = await authFetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${access}` },
  })
  if (userResponse.status >= 500) {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  if (!userResponse.ok) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 })
  }
  const user = (await userResponse.json()) as { email?: string; app_metadata?: { role?: string } }
  const email = user.email?.trim().toLowerCase() || ""
  if (!isOwnerIdentity(email, user.app_metadata?.role)) {
    return NextResponse.json({ error: "Not an owner mailbox." }, { status: 403 })
  }
  const jar = await cookies()
  jar.set("ava_office", encodeOfficeSession(access, refresh, expiresIn), officeCookieOptions(expiresIn))
  if (service && ownerEmails().includes(email)) {
    await authFetch(`${url}/rest/v1/rpc/sync_owner_email`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({ owner_email: email }),
    }).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}
