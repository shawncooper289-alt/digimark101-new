import { cookies } from "next/headers"
import { chooseDeskHeaders } from "@/lib/desk-auth"
import { missingOfficeEnv, officeConfig, readOfficeOwner } from "@/lib/office-store"

type Row = Record<string, unknown>

export async function requireOwner() {
  const owner = await readOfficeOwner()
  if (!owner) return null
  return owner
}

let serviceState: "unknown" | "ok" | "rejected" = "unknown"
let serviceDecision: Promise<void> | null = null

export function deskKeyRejected() {
  return serviceState === "rejected"
}

async function ownerAccess() {
  const raw = (await cookies()).get("ava_office")?.value
  if (!raw) return ""
  try {
    const bag = JSON.parse(raw) as { access?: string }
    return bag.access || ""
  } catch {
    return ""
  }
}

async function headers() {
  const { url, service, anon } = officeConfig()
  if (!serviceDecision) {
    serviceDecision = (async () => {
      const choice = await chooseDeskHeaders({
        url,
        service,
        anon,
        ownerAccess: await ownerAccess(),
        serviceState,
        probe: async (probeHeaders) => {
          if (!url) return 401
          const response = await fetch(`${url}/rest/v1/`, { headers: probeHeaders, cache: "no-store" })
          return response.status
        },
      })
      serviceState = choice.serviceState
    })()
  }
  await serviceDecision
  const choice = await chooseDeskHeaders({
    url,
    service,
    anon,
    ownerAccess: await ownerAccess(),
    serviceState,
    probe: async () => (serviceState === "rejected" ? 401 : 200),
  })
  return choice.headers
}

export async function deskCount(table: string, filter = "") {
  const { url, configured } = officeConfig()
  if (!configured) return null
  const response = await fetch(`${url}/rest/v1/${table}?select=id${filter ? `&${filter}` : ""}`, {
    headers: { ...(await headers()), Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  })
  if (!response.ok) return null
  const total = response.headers.get("content-range")?.split("/")[1]
  if (!total || total === "*") return null
  const count = Number(total)
  return Number.isFinite(count) ? count : null
}

export async function deskRows(table: string, query: string) {
  const rows = await deskRowsMaybe(table, query)
  return rows ?? []
}

export async function deskRowsMaybe(table: string, query: string) {
  const { url, configured } = officeConfig()
  if (!configured) return [] as Row[]
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: await headers(),
    cache: "no-store",
  })
  if (!response.ok) return null
  const data = (await response.json()) as unknown
  return Array.isArray(data) ? (data as Row[]) : []
}

export async function deskClients() {
  const { url, configured } = officeConfig()
  if (!configured) return [] as { id: string; email: string; role: string; created: string }[]
  const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: await headers(),
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
  return { premium, staging, rejected, contacts, deals, automations, subscriptions, orders, missing: missingOfficeEnv(), keyRejected: deskKeyRejected() }
}

export async function deskInsert(table: string, row: Record<string, unknown>) {
  const { url, configured } = officeConfig()
  if (!configured || !url) return false
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...(await headers()), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
    cache: "no-store",
  })
  return response.ok
}

export function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : ""
}
