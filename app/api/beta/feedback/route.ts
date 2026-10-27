import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"
import { currentUser } from "@/lib/supabase/server"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const { supabase, user } = await currentUser()
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to send feedback." }, { status: 401 })

  const { data: seat } = await supabase
    .from("seats")
    .select("is_beta")
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("is_beta", true)
    .maybeSingle()
  if (!seat?.is_beta) return NextResponse.json({ error: "Feedback is open to beta accounts." }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Send a JSON object." }, { status: 400 })
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  const text = typeof record.body === "string" ? record.body.trim().slice(0, 4000) : ""
  if (text.length < 2) return NextResponse.json({ error: "Tell us what is missing or what broke." }, { status: 400 })
  const page = typeof record.page === "string" ? record.page.trim().slice(0, 200) : ""

  const { data, error } = await supabase.rpc("submit_beta_feedback", { note: text, note_page: page })
  const result = data as { ok?: boolean } | null
  if (error || !result?.ok) return NextResponse.json({ error: "Could not save that note." }, { status: 500 })
  return NextResponse.json({ ok: true })
}
