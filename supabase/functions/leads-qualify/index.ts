import { authorized, rest } from "../_shared/gate.ts"

const threshold = Number(Deno.env.get("LEAD_PREMIUM_MIN_SCORE") || "70")

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  return rest("rpc/promote_premium_leads", {
    method: "POST",
    body: JSON.stringify({ min_score: Number.isFinite(threshold) ? threshold : 70 }),
  })
})
