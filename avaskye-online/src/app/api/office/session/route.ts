import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { encodeOfficeSession, officeConfig, officeCookieOptions, officeSignInAllowed, supabaseKeyHeaders } from "@/lib/office-store"

const COOKIE = "ava_office"

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

function alreadyRegistered(status: number, detail: string) {
  const text = detail.toLowerCase()
  return status === 422 || text.includes("already") || text.includes("exists") || text.includes("registered") || text.includes("duplicate")
}

async function openSession(url: string, anon: string, email: string, password: string) {
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  })
  if (!response.ok) return null
  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; user?: { email?: string } }
  if (!data.access_token || !data.refresh_token) return null
  if ((data.user?.email?.trim().toLowerCase() || "") !== email) return null
  return data
}

async function stampOwner(url: string, service: string, email: string) {
  if (!service) return
  await fetch(`${url}/rest/v1/rpc/sync_owner_email`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
    body: JSON.stringify({ owner_email: email }),
    cache: "no-store",
  }).catch(() => null)
}

async function createFounder(url: string, anon: string, service: string, email: string, password: string) {
  if (service) {
    const response = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "owner" },
        user_metadata: { line: "avaskye-founder" },
      }),
      cache: "no-store",
    })
    if (response.ok) return { created: true as const }
    const detail = await response.text()
    if (alreadyRegistered(response.status, detail)) return { created: false as const, exists: true as const }
  }
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password, data: { line: "avaskye-founder" } }),
    cache: "no-store",
  })
  const raw = await response.text()
  if (!response.ok) {
    if (alreadyRegistered(response.status, raw)) return { created: false as const, exists: true as const }
    return { created: false as const, exists: false as const }
  }
  let data: { identities?: unknown[]; access_token?: string } = {}
  try {
    data = JSON.parse(raw) as typeof data
  } catch {
    data = {}
  }
  if (Array.isArray(data.identities) && data.identities.length === 0 && !data.access_token) {
    return { created: false as const, exists: true as const }
  }
  return { created: true as const }
}

export async function POST(request: Request) {
  if (!officeSignInAllowed(clientIp(request))) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429 })
  }
  const { url, anon, service, emails } = officeConfig()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: "Owner sign-in needs Supabase configured on this server." }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; intent?: string } | null
  const email = body?.email?.trim().toLowerCase() || ""
  const password = body?.password || ""
  const intent = body?.intent === "signup" || body?.intent === "recover" ? body.intent : "signin"
  if (!email || !emails.includes(email) || (intent !== "recover" && !password)) {
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  if (intent === "recover") {
    await fetch(`${url}/auth/v1/recover`, {
      method: "POST",
      headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
      body: JSON.stringify({ email, redirect_to: "https://www.avaskye.online/" }),
      cache: "no-store",
    }).catch(() => null)
    return NextResponse.json({ ok: true, message: "If this mailbox can open the office, a reset link is on its way." })
  }
  if (intent === "signup" && (password.length < 8 || password.length > 72)) {
    return NextResponse.json({ error: "Use a password between 8 and 72 characters." }, { status: 400 })
  }
  if (intent === "signup") {
    const created = await createFounder(url, anon, service, email, password)
    if ("exists" in created && created.exists) {
      return NextResponse.json({ error: "That mailbox already has a password. Sign in instead." }, { status: 409 })
    }
    if (!created.created) {
      return NextResponse.json({ error: "Could not save the founder password. Try again in a minute." }, { status: 503 })
    }
  }
  const data = await openSession(url, anon, email, password)
  if (!data?.access_token || !data.refresh_token) {
    if (intent === "signup") {
      return NextResponse.json({ confirm: true, message: "Founder password saved. Open the confirmation email, then sign in." })
    }
    return NextResponse.json({ error: "Owner sign-in failed." }, { status: 401 })
  }
  const jar = await cookies()
  jar.set(COOKIE, encodeOfficeSession(data.access_token, data.refresh_token, data.expires_in || 3600), officeCookieOptions(data.expires_in || 3600))
  await stampOwner(url, service, email)
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const jar = await cookies()
  jar.set(COOKIE, "", officeCookieOptions(0))
  return NextResponse.json({ ok: true })
}
