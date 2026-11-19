import { LEAD_NICHE_KEYS } from "@/lib/store/catalog"
import { clientIp, sameOrigin, tooManyRequests } from "@/lib/http"
import { isOwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Cross-origin request blocked." }, { status: 403 })
  if (tooManyRequests(`lead-price:${clientIp(request)}`, 20)) return Response.json({ error: "Too many requests." }, { status: 429 })
  const { user } = await currentUser()
  if (!isOwnerIdentity(user)) return Response.json({ error: "Only the owner can set lead prices." }, { status: 403 })
  let body: { niche?: unknown; amount?: unknown; packSize?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }
  const niche = typeof body.niche === "string" ? body.niche : ""
  if (!(LEAD_NICHE_KEYS as readonly string[]).includes(niche)) return Response.json({ error: "Pick an existing niche." }, { status: 400 })
  const raw = typeof body.amount === "string" ? Number(body.amount.replace(/[$,]/g, "")) : Number.NaN
  const pack = Math.round(Number(body.packSize) || 25)
  if (!Number.isFinite(raw) || raw < 0 || pack < 1 || pack > 500) return Response.json({ error: "Set a price and a pack size." }, { status: 400 })
  const admin = createSupabaseAdmin()
  if (!admin) return Response.json({ error: "The service role is not configured." }, { status: 503 })
  const { error } = await admin.from("lead_niche_prices").upsert({
    niche_key: niche,
    price_cents: Math.round(raw * 100),
    pack_size: pack,
    currency: "USD",
    updated_at: new Date().toISOString(),
  })
  if (error) {
    const missing = /does not exist|schema cache/i.test(error.message)
    return Response.json({ error: missing ? "Apply supabase/migrations/20261121_sales_surfaces.sql first." : "Could not save that price." }, { status: missing ? 503 : 502 })
  }
  return Response.json({ summary: `${niche} is saved. PayPal plans were not changed.` })
}
