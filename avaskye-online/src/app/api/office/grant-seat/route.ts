import { NextResponse } from "next/server"
import { grantSeat } from "@/lib/grant-seat"
import { readOfficeOwner } from "@/lib/office-store"

export async function POST(request: Request) {
  const owner = await readOfficeOwner()
  if (!owner) return NextResponse.json({ error: "The owner office is closed." }, { status: 403 })
  const body = (await request.json().catch(() => null)) as { email?: string; planKey?: string; confirmed?: boolean } | null
  if (body?.confirmed !== true) return NextResponse.json({ error: "Confirm the grant before sending it." }, { status: 400 })
  const result = await grantSeat({
    email: body.email || "",
    planKey: body.planKey || "monthly",
    grantedBy: owner.id,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({
    ok: true,
    invited: result.invited,
    status: result.status,
    message: result.invited
      ? "Seat saved and a studio login link was sent."
      : "Seat saved. The login email did not send. Check Supabase Auth email, then grant again.",
  })
}
