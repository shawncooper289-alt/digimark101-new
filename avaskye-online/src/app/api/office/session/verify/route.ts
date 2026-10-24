import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { encodeOfficeSession, officeConfig, officeCookieOptions, supabaseKeyHeaders } from "@/lib/office-store"

const TYPES = new Set(["magiclink", "email", "signup", "invite", "recovery"])

export async function POST(request: Request) {
  const { url, anon, emails, service } = officeConfig()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { token_hash?: string; type?: string } | null
  const tokenHash = body?.token_hash || ""
  const type = TYPES.has(body?.type || "") ? body?.type || "magiclink" : "magiclink"
  if (!tokenHash || tokenHash.length > 2000) {
    return NextResponse.json({ error: "Missing login token." }, { status: 400 })
  }
  const response = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ type, token_hash: tokenHash }),
    cache: "no-store",
  })
  if (!response.ok) {
    return NextResponse.json({ error: "Login link expired. Request a new one." }, { status: 401 })
  }
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; user?: { email?: string } }
  const email = data.user?.email?.trim().toLowerCase() || ""
  if (!data.access_token || !data.refresh_token || !emails.includes(email)) {
    return NextResponse.json({ error: "Not an owner mailbox." }, { status: 403 })
  }
  const jar = await cookies()
  jar.set("ava_office", encodeOfficeSession(data.access_token, data.refresh_token, data.expires_in || 3600), officeCookieOptions(data.expires_in || 3600))
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
