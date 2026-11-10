import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { readAuthError } from "@/lib/auth-failure"
import { authFetch } from "@/lib/auth-fetch"
import { officeConfig, supabaseKeyHeaders } from "@/lib/office-store"

export async function POST(request: Request) {
  const { url, anon } = officeConfig()
  const raw = (await cookies()).get("ava_office")?.value
  if (!url || !anon || !raw) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  let access = ""
  try {
    access = (JSON.parse(raw) as { access?: string }).access || ""
  } catch {
    access = ""
  }
  if (!access) return NextResponse.json({ error: "Sign in first." }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { password?: string } | null
  const password = body?.password || ""
  if (password.length < 8) return NextResponse.json({ error: "Use at least 8 characters." }, { status: 400 })
  const response = await authFetch(`${url}/auth/v1/user`, {
    method: "PUT",
    headers: { ...supabaseKeyHeaders(anon, { "Content-Type": "application/json" }), Authorization: `Bearer ${access}` },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) {
    const failure = await readAuthError(response)
    if (failure.status === 429) return NextResponse.json({ error: failure.error }, { status: 429 })
    return NextResponse.json({ error: "Could not update the password." }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
