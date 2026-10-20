import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { encodeOfficeSession, officeConfig, officeCookieOptions, supabaseKeyHeaders } from "@/lib/office-store"

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
  const userResponse = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${access}` },
    cache: "no-store",
  })
  if (!userResponse.ok) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 })
  }
  const user = (await userResponse.json()) as { email?: string }
  const email = user.email?.trim().toLowerCase() || ""
  if (!emails.includes(email)) {
    return NextResponse.json({ error: "Not an owner mailbox." }, { status: 403 })
  }
  const jar = await cookies()
  jar.set("ava_office", encodeOfficeSession(access, refresh, expiresIn), officeCookieOptions(expiresIn))
  if (service) {
    await fetch(`${url}/rest/v1/rpc/sync_owner_email`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({ owner_email: email }),
      cache: "no-store",
    }).catch(() => null)
  }
  return NextResponse.json({ ok: true })
}
