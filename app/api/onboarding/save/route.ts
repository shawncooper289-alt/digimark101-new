import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { supabasePublicConfig } from "@/lib/supabase/config"
import { createSupabaseServer } from "@/lib/supabase/server"

const TEXT_FIELDS = [
  "client_name",
  "personal_email",
  "business_email",
  "business_name",
  "personal_phone",
  "business_phone",
  "business_address",
  "business_website",
  "facebook_url",
  "instagram_url",
  "google_business_url",
  "linkedin_url",
  "tiktok_url",
  "youtube_url",
  "x_url",
] as const

type OnboardingWriter = SupabaseClient

async function writerFor(req: NextRequest): Promise<{ supabase: OnboardingWriter; userId: string } | { response: NextResponse }> {
  const header = req.headers.get("authorization") || ""
  const bearer = /^Bearer\s+(\S+)/i.exec(header)?.[1]
  if (bearer) {
    const config = supabasePublicConfig()
    if (!config) return { response: NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 }) }
    const supabase = createClient(config.url, config.key, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabase.auth.getUser(bearer)
    if (error || !data.user) {
      return { response: NextResponse.json({ error: "Sign in to save your account setup." }, { status: 401 }) }
    }
    return { supabase, userId: data.user.id }
  }

  const supabase = await createSupabaseServer()
  if (!supabase) return { response: NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 }) }
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Sign in to save your account setup." }, { status: 401 }) }
  }
  return { supabase, userId: data.user.id }
}

function allowedFields(body: Record<string, unknown>) {
  const fields: Record<string, string | boolean> = {}
  for (const key of TEXT_FIELDS) {
    const value = body[key]
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed) continue
    fields[key] = trimmed.slice(0, 2000)
  }
  if (typeof body.onboarding_complete === "boolean") fields.onboarding_complete = body.onboarding_complete
  return fields
}

export async function POST(req: NextRequest) {
  const writer = await writerFor(req)
  if ("response" in writer) return writer.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Send a JSON object." }, { status: 400 })
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Send a JSON object." }, { status: 400 })
  }

  const record = body as Record<string, unknown>
  if ("user_id" in record && record.user_id != null && String(record.user_id).toLowerCase() !== writer.userId.toLowerCase()) {
    return NextResponse.json({ error: "You can only save your own account setup." }, { status: 403 })
  }

  const { data, error } = await writer.supabase
    .from("client_onboarding")
    .upsert(
      {
        user_id: writer.userId,
        ...allowedFields(record),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single()

  if (error) {
    console.error("onboarding save failed", error.code)
    return NextResponse.json({ error: "Could not save your account setup." }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
