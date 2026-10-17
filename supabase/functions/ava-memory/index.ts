import { authorized, rest } from "../_shared/gate.ts"

Deno.serve(async (req) => {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null) as { owner_id?: string; memory_key?: string; memory_value?: string } | null
  if (!body?.owner_id || !body.memory_key || !body.memory_value) {
    return Response.json({ error: "owner, key, and value required" }, { status: 400 })
  }
  return rest("client_memory", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      owner_id: body.owner_id,
      memory_key: body.memory_key.slice(0, 80),
      memory_value: body.memory_value.slice(0, 2000),
      updated_at: new Date().toISOString(),
    }),
  })
})
