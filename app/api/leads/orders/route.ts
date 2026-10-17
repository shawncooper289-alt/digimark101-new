import { confirmLeadOrder, createLeadOrder, releaseLeadOrder } from "@/lib/leads/engine"
import { currentUser } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { user } = await currentUser()
  if (!user) return Response.json({ error: "Sign in before requesting a list." }, { status: 401 })
  let body: { niche?: unknown; orderId?: unknown; action?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 })
  }
  if (body.action === "confirm") {
    const orderId = typeof body.orderId === "string" ? body.orderId : ""
    const result = await confirmLeadOrder(user, orderId)
    return Response.json(result, { status: result.ok ? 200 : result.reason === "forbidden" ? 403 : 400 })
  }
  if (body.action === "release") {
    const orderId = typeof body.orderId === "string" ? body.orderId : ""
    const result = await releaseLeadOrder(user.id, orderId)
    return Response.json(result, { status: result.ok ? 200 : result.reason === "forbidden" ? 403 : 402 })
  }
  const niche = typeof body.niche === "string" ? body.niche : ""
  const result = await createLeadOrder(user.id, niche)
  return Response.json(result, { status: result.ok ? 200 : 400 })
}
