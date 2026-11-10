import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { readAuthError } from "@/lib/auth-failure"
import { authFetch } from "@/lib/auth-fetch"
import { missingOfficeAuthEnv, officeResetUrl } from "@/lib/office-redirect"
import { mailboxIsOwner, officeConfig, officeSignInAllowed, supabaseKeyHeaders } from "@/lib/office-store"
import { createPkcePair, pkceCookieOptions } from "@/lib/pkce"

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  return forwarded.split(",")[0]?.trim() || "local"
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
    allowed = Boolean(email && (await mailboxIsOwner(email)))
  } catch {
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  if (!allowed) {
    return NextResponse.json({ error: "A reset link can only be sent to an owner mailbox." }, { status: 400 })
  }
  const redirectTo = officeResetUrl(request)
  const { verifier, challenge } = createPkcePair()
  const jar = await cookies()
  jar.set("ava_pkce", verifier, pkceCookieOptions())
  const endpoint = new URL(`${url}/auth/v1/recover`)
  endpoint.searchParams.set("redirect_to", redirectTo)
  const response = await authFetch(endpoint.toString(), {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      email,
      code_challenge: challenge,
      code_challenge_method: "s256",
    }),
  })
  if (response.status >= 500) {
    jar.delete("ava_pkce")
    return NextResponse.json({ error: "The shared login service is unavailable. Please try again shortly." }, { status: 503 })
  }
  if (!response.ok) {
    jar.delete("ava_pkce")
    const failure = await readAuthError(response)
    if (failure.status === 429) return NextResponse.json({ error: failure.error }, { status: 429 })
    return NextResponse.json({ error: "Could not send the reset link. Please try again later." }, { status: 400 })
  }
  return NextResponse.json({
    ok: true,
    message: "Reset link sent. Open it in this browser. Check spam if it does not arrive.",
  })
}
