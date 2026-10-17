import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"
import { listManagedBackends, managedBackendConfigured, provisionBackend } from "@/lib/managed/backend"
import { isOwnerIdentity } from "@/lib/owner/access"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const { user } = await currentUser()
  if (!user) return NextResponse.json({ configured: managedBackendConfigured(), backends: [] }, { status: 401 })
  const owner = isOwnerIdentity(user)
  const backends = await listManagedBackends(user, owner)
  return NextResponse.json({ configured: managedBackendConfigured(), owner, backends })
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const { user } = await currentUser()
  if (!user) return NextResponse.json({ error: "Sign in before provisioning a backend." }, { status: 401 })
  if (!managedBackendConfigured()) return NextResponse.json({ ok: false, reason: "unconfigured" })
  let body: { name?: unknown; region?: unknown; siteUrl?: unknown; confirmed?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  if (body.confirmed !== true) return NextResponse.json({ error: "Confirm the draft before saving." }, { status: 400 })
  const result = await provisionBackend({
    userId: user.id,
    name: typeof body.name === "string" ? body.name : "",
    region: typeof body.region === "string" ? body.region : "",
    siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : undefined,
  })
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
