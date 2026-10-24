import { NextResponse } from "next/server"
import { missingOfficeAuthEnv, officeCallbackUrl } from "@/lib/office-redirect"
import { officeConfig, officeSignInAllowed, supabaseKeyHeaders } from "@/lib/office-store"

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
  const email = body?.email?.trim().toLowerCase() || ""
  if (!email || !emails.includes(email)) {
    return NextResponse.json({ error: "Login link can only be sent to an owner mailbox." }, { status: 400 })
  }
  const redirectTo = officeCallbackUrl(request)
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: supabaseKeyHeaders(anon, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      email,
      create_user: true,
      options: { emailRedirectTo: redirectTo },
    }),
    cache: "no-store",
  })
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    return NextResponse.json({ error: text || "Could not send login link." }, { status: 400 })
  }
  return NextResponse.json({ ok: true, message: "Login link sent. Open it in this browser. Check spam if it does not arrive." })
}
