import { authorized, rest, service } from "../_shared/gate.ts"

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null) as { owner_id?: string; name?: string; region?: string } | null
  if (!body?.owner_id || !body.name || !body.region) return Response.json({ error: "owner, name, and region required" }, { status: 400 })
  const logged = await rest("provisioning_jobs", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ owner_id: body.owner_id, name: body.name, region: body.region, status: "provisioning", detail: "edge" }),
  })
  const token = Deno.env.get("SUPABASE_MANAGEMENT_TOKEN")
  const org = Deno.env.get("SUPABASE_ORG_ID")
  const db = service()
  if (!token || !org || !db) return logged
  const created = await fetch("https://api.supabase.com/v1/projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: body.name, organization_id: org, region: body.region, db_pass: crypto.randomUUID() }),
  })
  return Response.json({ logged: logged.status, management: created.status })
})
