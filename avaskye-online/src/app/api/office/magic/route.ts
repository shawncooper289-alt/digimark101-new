import { authFetch } from "@/lib/auth-fetch"
import { NextResponse } from "next/server"
import { missingOfficeAuthEnv, officeCallbackUrl } from "@/lib/office-redirect"
import { mailboxIsOwner, officeConfig, officeSignInAllowed, supabaseKeyHeaders } from "@/lib/office-store"

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

export async function POST(request: Request) {
  if (!officeSignInAllowed(clientIp(request))) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 })
  }
  const { url, anon, emails } = officeConfig()
  const missing = missingOfficeAuthEnv()
  if (!url || !anon || !emails.length) {
    return NextResponse.json({ error: `Owner sign-in is missing ${missing.join(", ") || "Supabase settings"}.` }, { status: 503 })
  }
  const body = (await request.json().catch(() => null)) as { email?: string } | null
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  let allowed = false
  try {
    allowed = Boolean(email && await mailboxIsOwner(email))
  } catch {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  if (!allowed) {
    return NextResponse.json({ error: "Login link can only be sent to an owner mailbox." }, { status: 400 })
  }
  const redirectTo = officeCallbackUrl(request)
  // This is the Auth REST API, not supabase-js: redirects belong in the query.
  const endpoint = new URL(`${url}/auth/v1/otp`)
  endpoint.searchParams.set("redirect_to", redirectTo)
  const response = await authFetch(endpoint.toString(), {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      email,
      create_user: true,
    }),
    cache: "no-store",
  })
  if (response.status >= 500) return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  if (!response.ok) {
    return NextResponse.json({ error: "Could not send login link. Please try again later." }, { status: response.status === 429 ? 429 : 400 })
  }
  return NextResponse.json({ ok: true, message: "Login link sent. Open it in this browser. Check spam if it does not arrive." })
}
