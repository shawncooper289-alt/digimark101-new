import { NextResponse } from "next/server"
import { sameOrigin } from "@/lib/http"
import { deliverSeat } from "@/lib/seats/deliver"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 })
  const { user } = await currentUser()
  const email = user?.email?.trim().toLowerCase() || ""
  if (!user || !email) return NextResponse.json({ beta: false })

  const admin = createSupabaseAdmin()
  if (!admin) return NextResponse.json({ beta: false })

  const { data: seat } = await admin
    .from("seats")
    .select("id, status, is_beta, source")
    .eq("email", email)
    .in("status", ["pending", "active"])
    .maybeSingle()

  if (!seat || (!seat.is_beta && seat.source !== "beta")) return NextResponse.json({ beta: false })
  if (seat.status === "active" && seat.is_beta) return NextResponse.json({ beta: true })

  const delivered = await deliverSeat({
    email,
    userId: user.id,
    source: "beta",
    planKey: "monthly",
    sendInvite: false,
  })
  return NextResponse.json({ beta: delivered.ok })
}
