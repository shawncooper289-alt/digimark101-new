import { authorized, rest } from "../_shared/gate.ts"

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null) as { niche?: string; source_kind?: string; consent_contact?: boolean; consent_share?: boolean } | null
  if (!body?.consent_contact || !body.source_kind) return Response.json({ error: "consent and source are required" }, { status: 400 })
  return rest("lead_staging", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      niche: body.niche || "general",
      source_kind: body.source_kind,
      consent_contact: true,
      consent_share: Boolean(body.consent_share),
      consent_at: new Date().toISOString(),
    }),
  })
})
