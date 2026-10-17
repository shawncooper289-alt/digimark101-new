import { authorized, rest } from "../_shared/gate.ts"

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null) as { id?: string; event_type?: string; resource?: { id?: string } } | null
  if (!body?.id || !body.event_type) return Response.json({ error: "event id and type required" }, { status: 400 })
  return rest("paypal_webhook_events", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      event_id: body.id,
      event_type: body.event_type,
      paypal_subscription_id: body.resource?.id ?? null,
      payload: body.resource ?? {},
    }),
  })
})
