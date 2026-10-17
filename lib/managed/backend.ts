import { createHash, randomBytes } from "node:crypto"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

const REGIONS = new Set(["us-east-1", "us-west-1", "eu-west-1", "eu-central-1", "ap-southeast-1", "ap-northeast-1"])

export type ManagedRow = {
  id: string
  ownerId: string
  projectRef: string
  name: string
  region: string
  status: string
  apiUrl: string
}

export function managedBackendConfigured() {
  const org = Boolean(process.env.SUPABASE_ORG_ID?.trim())
  const token = Boolean(process.env.SUPABASE_MANAGEMENT_TOKEN?.trim())
  const oauth = Boolean(
    process.env.SUPABASE_OAUTH_CLIENT_ID?.trim() &&
      process.env.SUPABASE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.SUPABASE_OAUTH_REFRESH_TOKEN?.trim(),
  )
  return org && (token || oauth)
}

async function managementToken() {
  const direct = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim()
  if (direct) return direct
  const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET?.trim()
  const refresh = process.env.SUPABASE_OAUTH_REFRESH_TOKEN?.trim()
  if (!clientId || !clientSecret || !refresh) return null
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
  })
  const response = await fetch("https://api.supabase.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) return null
  const payload = (await response.json()) as { access_token?: unknown }
  return typeof payload.access_token === "string" ? payload.access_token : null
}

async function managementFetch(path: string, init?: RequestInit) {
  const token = await managementToken()
  if (!token) return null
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(12000),
  })
  return response
}

function mapRow(row: Record<string, unknown>): ManagedRow {
  return {
    id: String(row.id || ""),
    ownerId: String(row.owner_id || ""),
    projectRef: String(row.project_ref || ""),
    name: String(row.name || ""),
    region: String(row.region || ""),
    status: String(row.status || "unknown"),
    apiUrl: String(row.api_url || ""),
  }
}

export async function listManagedBackends(user: { id: string }, owner: boolean) {
  const admin = createSupabaseAdmin()
  if (!admin) return []
  const query = admin.from("managed_backends").select("id, owner_id, project_ref, name, region, status, api_url").order("created_at", { ascending: false })
  const { data, error } = owner ? await query : await query.eq("owner_id", user.id)
  if (error || !data) return []
  return data.map((row) => mapRow(row as Record<string, unknown>))
}

async function readKeyPresence(ref: string) {
  const response = await managementFetch(`/projects/${ref}/api-keys`)
  if (!response?.ok) return false
  const payload = (await response.json()) as { name?: string; api_key?: string }[]
  const present = Array.isArray(payload) && payload.some((item) => item.api_key && (item.name === "anon" || item.name === "service_role"))
  return present
}

export async function provisionBackend(input: { userId: string; name: string; region: string; siteUrl?: string }) {
  if (!managedBackendConfigured()) return { ok: false as const, reason: "unconfigured" as const }
  const org = process.env.SUPABASE_ORG_ID?.trim() || ""
  const region = REGIONS.has(input.region) ? input.region : ""
  const name = input.name.trim().slice(0, 40)
  if (!region || name.length < 2) return { ok: false as const, reason: "rejected" as const }
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, reason: "unconfigured" as const }

  const { data: existing } = await admin.from("managed_backends").select("id, project_ref, name, region, status, api_url, owner_id").eq("owner_id", input.userId).maybeSingle()
  if (existing?.project_ref) return { ok: true as const, backend: mapRow(existing as Record<string, unknown>) }

  const slug = `dm101-${createHash("sha256").update(input.userId).digest("hex").slice(0, 8)}`
  const dbPass = randomBytes(24).toString("base64url")
  const response = await managementFetch("/projects", {
    method: "POST",
    body: JSON.stringify({
      name: slug,
      organization_id: org,
      region,
      db_pass: dbPass,
    }),
  })
  if (!response?.ok) return { ok: false as const, reason: "rejected" as const }
  const created = (await response.json()) as { id?: string; ref?: string; status?: string }
  const ref = created.ref || created.id
  if (!ref) return { ok: false as const, reason: "rejected" as const }
  const apiUrl = `https://${ref}.supabase.co`
  const site = input.siteUrl?.startsWith("https://") ? input.siteUrl : process.env.NEXT_PUBLIC_SITE_URL
  if (site?.startsWith("https://")) {
    await managementFetch(`/projects/${ref}/config/auth`, {
      method: "PATCH",
      body: JSON.stringify({ site_url: site }),
    })
  }
  const keysReady = await readKeyPresence(ref)
  const status = created.status || (keysReady ? "active" : "provisioning")
  const { data, error } = await admin
    .from("managed_backends")
    .insert({
      owner_id: input.userId,
      project_ref: ref,
      name,
      region,
      status,
      api_url: apiUrl,
    })
    .select("id, owner_id, project_ref, name, region, status, api_url")
    .single()
  if (error || !data) return { ok: false as const, reason: "rejected" as const }
  return { ok: true as const, backend: mapRow(data as Record<string, unknown>) }
}
