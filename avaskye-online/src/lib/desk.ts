import { missingOfficeEnv, officeConfig, readOfficeOwner } from "@/lib/office-store"

type Row = Record<string, unknown>

export async function requireOwner() {
  const owner = await readOfficeOwner()
  if (!owner) return null
  return owner
}

function headers() {
  const { service } = officeConfig()
  return { apikey: service, Authorization: `Bearer ${service}` }
}

export async function deskCount(table: string, filter = "") {
  const { url, configured } = officeConfig()
  if (!configured) return null
  const response = await fetch(`${url}/rest/v1/${table}?select=id${filter ? `&${filter}` : ""}`, {
    headers: { ...headers(), Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  })
  if (!response.ok) return null
  const total = response.headers.get("content-range")?.split("/")[1]
  if (!total || total === "*") return null
  const count = Number(total)
  return Number.isFinite(count) ? count : null
}

export async function deskRows(table: string, query: string) {
  const { url, configured } = officeConfig()
  if (!configured) return [] as Row[]
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  })
  if (!response.ok) return [] as Row[]
  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as Row[]) : []
}

export async function deskClients() {
  const { url, configured } = officeConfig()
  if (!configured) return [] as { id: string; email: string; role: string; created: string }[]
  const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: headers(),
    cache: "no-store",
  })
  if (!response.ok) return []
  const data = (await response.json()) as { users?: { id: string; email?: string; created_at?: string; app_metadata?: { role?: string } }[] }
  return (data.users ?? []).map((user) => ({
    id: user.id,
    email: user.email || "No email",
    role: user.app_metadata?.role || "member",
    created: user.created_at || "",
  }))
}

export async function deskSnapshot() {
  const [premium, staging, rejected, contacts, deals, automations, subscriptions, orders] = await Promise.all([
    deskCount("lead_records"),
    deskCount("lead_staging"),
    deskCount("lead_rejected"),
    deskCount("contacts"),
    deskCount("deals"),
    deskCount("automations", "enabled=eq.true"),
    deskCount("subscriptions"),
    deskCount("lead_orders"),
  ])
  return { premium, staging, rejected, contacts, deals, automations, subscriptions, orders, missing: missingOfficeEnv() }
}

export function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : ""
}
