export function authorized(req: Request) {
  const secret = Deno.env.get("CRON_SECRET") || Deno.env.get("LEAD_IMPORT_KEY") || ""
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`
}

export function service() {
  const url = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") || ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  if (!url || !key) return null
  return { url, key }
}

export async function rest(path: string, init: RequestInit) {
  const db = service()
  if (!db) return Response.json({ error: "unconfigured" }, { status: 503 })
  const response = await fetch(`${db.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: db.key,
      Authorization: `Bearer ${db.key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()
  return new Response(text, { status: response.status, headers: { "Content-Type": "application/json" } })
}
