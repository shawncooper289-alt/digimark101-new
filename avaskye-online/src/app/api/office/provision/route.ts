import { NextResponse } from "next/server"
import { officeConfig, ownerEmails } from "@/lib/office-store"

export async function POST(request: Request) {
  const setup = process.env.OFFICE_SETUP_KEY || ""
  const { url, service } = officeConfig()
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; setupKey?: string } | null
  if (!setup || body?.setupKey !== setup) return NextResponse.json({ error: "Not allowed." }, { status: 401 })
  const email = body?.email?.trim().toLowerCase() || ""
  const password = body?.password || ""
  if (!url || !service) return NextResponse.json({ error: "Service role is not available on this server." }, { status: 503 })
  if (!ownerEmails().includes(email) || password.length < 8) return NextResponse.json({ error: "Owner mailbox and a password are required." }, { status: 400 })
  const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" }
  const listed = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, { headers, cache: "no-store" })
  if (!listed.ok) return NextResponse.json({ error: "Could not read accounts." }, { status: 502 })
  const data = (await listed.json()) as { users?: { id: string; email?: string }[] }
  const existing = (data.users || []).find((user) => user.email?.toLowerCase() === email)
  const response = existing
    ? await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ password, email_confirm: true }),
        cache: "no-store",
      })
    : await fetch(`${url}/auth/v1/admin/users`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password, email_confirm: true }),
        cache: "no-store",
      })
  if (!response.ok) return NextResponse.json({ error: "Could not set the owner password." }, { status: 502 })
  return NextResponse.json({ ok: true })
}
