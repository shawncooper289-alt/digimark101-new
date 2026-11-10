import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { ONBOARDING_TEXT_FIELDS, onboardingPatch } from "@/lib/onboarding/fields"
import { isMissingSetupColumn, upsertClientOnboarding, withGrowthPlan } from "@/lib/onboarding/save-row"
import { supabasePublicConfig } from "@/lib/supabase/config"
import { createSupabaseServer } from "@/lib/supabase/server"

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
  const complete = body.onboarding_complete === true
  const fields = complete ? withGrowthPlan(onboardingPatch(body)) : onboardingPatch(body)
  return { fields, complete }
}

export async function GET() {
  const supabase = await createSupabaseServer()
  if (!supabase) return NextResponse.json({ signedIn: false, complete: false, fields: {} })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return NextResponse.json({ signedIn: false, complete: false, fields: {} })

  const columns = [...ONBOARDING_TEXT_FIELDS, "onboarding_complete"].join(",")
  const first = await supabase.from("client_onboarding").select(columns).eq("user_id", data.user.id).maybeSingle()
  const fallback = first.error && isMissingSetupColumn(first.error)
    ? await supabase
        .from("client_onboarding")
        .select([...ONBOARDING_TEXT_FIELDS.filter((field) => field !== "main_roadblock" && field !== "growth_plan"), "onboarding_complete"].join(","))
        .eq("user_id", data.user.id)
        .maybeSingle()
    : first
  if (fallback.error || !fallback.data) return NextResponse.json({ signedIn: true, complete: false, fields: {} })

  const row = fallback.data as unknown as Record<string, unknown>
  const fields: Record<string, string> = {}
  for (const key of ONBOARDING_TEXT_FIELDS) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) fields[key] = value.trim()
  }
  return NextResponse.json({ signedIn: true, complete: row.onboarding_complete === true, fields })
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

  const payload = allowedFields(record)
  const { data, error } = await upsertClientOnboarding(writer.supabase, writer.userId, payload.fields, { complete: payload.complete })

  if (error) {
    console.error("onboarding save failed", error.code)
    return NextResponse.json({ error: "Could not save your account setup." }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
