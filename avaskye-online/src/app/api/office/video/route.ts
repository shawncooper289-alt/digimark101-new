import { NextResponse } from "next/server"
import { omitBannedLine } from "@/lib/ava/banned-line"
import { AVA_IDENTITY } from "@/lib/ava/identity"
import { officeConfig, readOfficeOwner, supabaseKeyHeaders } from "@/lib/office-store"
import { handleVideoRequest } from "../../../../../../lib/video/handle"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const tools = {
  omitBannedLine,
  spokenText: (text: string) => text.replace(/\bAva\b/g, AVA_IDENTITY.pronunciation.phoneticSpelling),
}

async function saveCampaign(ownerId: string, name: string, brief: string) {
  const { url, service, configured } = officeConfig()
  if (!configured || !service) return { ok: false, error: "The office database is not connected. Nothing was posted." }
  const headers = supabaseKeyHeaders(service, { "Content-Type": "application/json", Prefer: "return=minimal" })
  const payload = {
    owner_id: ownerId,
    name: name.slice(0, 120),
    channel: "social",
    status: "draft",
    brief: brief.slice(0, 1000),
  }
  const response = await fetch(`${url}/rest/v1/campaigns`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  })
  if (response.ok) return { ok: true }
  const { owner_id, ...withoutOwner } = payload
  void owner_id
  const retry = await fetch(`${url}/rest/v1/campaigns`, {
    method: "POST",
    headers,
    body: JSON.stringify(withoutOwner),
    cache: "no-store",
  })
  if (retry.ok) return { ok: true }
  return { ok: false, error: "The schedule draft was not saved. Nothing was posted." }
}

export async function GET() {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const result = await handleVideoRequest({ action: "capabilities", payload: {}, env: process.env, tools })
  return NextResponse.json(result.body, { status: result.status })
}

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const payload = await request.json().catch(() => null) as { action?: unknown } | null
  const action = typeof payload?.action === "string" ? payload.action : ""
  const result = await handleVideoRequest({ action, payload, env: process.env, tools })
  if (action !== "handoff" || result.status !== 200 || typeof result.body.caption !== "string") {
    return NextResponse.json(result.body, { status: result.status })
  }
  const saved = await saveCampaign(
    owner.id,
    typeof result.body.project === "object" && result.body.project && "title" in result.body.project
      ? String((result.body.project as { title?: string }).title || "Video")
      : "Video",
    result.body.caption,
  )
  if (!saved.ok) return NextResponse.json({ error: saved.error, posted: false }, { status: 503 })
  return NextResponse.json({ ...result.body, saved: "Saved as a social draft. It has not been posted.", posted: false })
}
