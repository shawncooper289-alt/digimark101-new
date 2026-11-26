import { createSign } from "node:crypto"
import { indexNowKey, indexNowPayload } from "@/lib/indexnow"
import type { KpiRow } from "@/lib/ava/team/digest"

type Env = Record<string, string | undefined>

export type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown>; text: () => Promise<string> }>

export type ProviderFlag = { id: "gsc" | "ga4" | "bing" | "indexnow"; configured: boolean; mode: "read" | "submit" }

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"

export function trafficProviderFlags(env: Env = process.env): ProviderFlag[] {
  const google = serviceAccount(env)
  const token = env.GSC_ACCESS_TOKEN?.trim() || env.GOOGLE_ACCESS_TOKEN?.trim() || ""
  return [
    { id: "gsc", mode: "read", configured: Boolean(env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() && (google || token)) },
    { id: "ga4", mode: "read", configured: Boolean(env.GA4_PROPERTY_ID?.trim() && (google || token)) },
    { id: "bing", mode: "read", configured: Boolean(env.BING_WEBMASTER_API_KEY?.trim() && env.BING_SITE_URL?.trim()) },
    { id: "indexnow", mode: "submit", configured: Boolean(indexNowKey(env)) },
  ]
}

export function missingReadSources(env: Env = process.env) {
  return trafficProviderFlags(env).filter((flag) => flag.mode === "read" && !flag.configured).map((flag) => flag.id)
}

function serviceAccount(env: Env) {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { client_email?: unknown; private_key?: unknown }
    const clientEmail = typeof parsed.client_email === "string" ? parsed.client_email : ""
    const privateKey = typeof parsed.private_key === "string" ? parsed.private_key : ""
    if (!clientEmail || !privateKey.includes("BEGIN")) return null
    return { clientEmail, privateKey }
  } catch {
    return null
  }
}

export function signServiceAccountJwt(input: { clientEmail: string; privateKey: string; scope: string; now?: number }) {
  const now = input.now ?? Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(JSON.stringify({
    iss: input.clientEmail,
    scope: input.scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url")
  const unsigned = `${header}.${payload}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  const signature = signer.sign(input.privateKey).toString("base64url")
  return `${unsigned}.${signature}`
}

export function metricsFromSearchConsole(body: unknown): KpiRow[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { rows?: unknown }).rows)) return []
  const points: KpiRow[] = []
  for (const row of (body as { rows: unknown[] }).rows) {
    if (!row || typeof row !== "object") continue
    const record = row as { clicks?: unknown; impressions?: unknown; keys?: unknown }
    const day = Array.isArray(record.keys) && typeof record.keys[0] === "string" ? record.keys[0] : ""
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    if (typeof record.clicks === "number" && Number.isFinite(record.clicks)) {
      points.push({ source: "gsc", metric: "clicks", value: record.clicks, periodStart: day, periodEnd: day })
    }
    if (typeof record.impressions === "number" && Number.isFinite(record.impressions)) {
      points.push({ source: "gsc", metric: "impressions", value: record.impressions, periodStart: day, periodEnd: day })
    }
  }
  return points
}

export function metricsFromGa4(body: unknown, periodStart: string, periodEnd: string): KpiRow[] {
  if (!body || typeof body !== "object") return []
  const record = body as { rows?: unknown; metricHeaders?: unknown }
  if (!Array.isArray(record.rows) || !record.rows.length || !Array.isArray(record.metricHeaders)) return []
  const headers = record.metricHeaders
    .map((header) => (header && typeof header === "object" && typeof (header as { name?: unknown }).name === "string" ? (header as { name: string }).name : ""))
  const values = (record.rows[0] as { metricValues?: unknown }).metricValues
  if (!Array.isArray(values)) return []
  const points: KpiRow[] = []
  headers.forEach((metric, index) => {
    const cell = values[index] as { value?: unknown } | undefined
    const value = typeof cell?.value === "string" ? Number(cell.value) : Number.NaN
    if (!metric || !Number.isFinite(value)) return
    points.push({ source: "ga4", metric, value, periodStart, periodEnd })
  })
  return points
}

export function metricsFromBing(body: unknown): KpiRow[] {
  const rows = body && typeof body === "object" && Array.isArray((body as { d?: unknown }).d) ? (body as { d: unknown[] }).d : []
  const points: KpiRow[] = []
  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    const record = row as { Date?: unknown; Clicks?: unknown; Impressions?: unknown }
    const day = bingDay(record.Date)
    if (!day) continue
    if (typeof record.Clicks === "number" && Number.isFinite(record.Clicks)) {
      points.push({ source: "bing", metric: "clicks", value: record.Clicks, periodStart: day, periodEnd: day })
    }
    if (typeof record.Impressions === "number" && Number.isFinite(record.Impressions)) {
      points.push({ source: "bing", metric: "impressions", value: record.Impressions, periodStart: day, periodEnd: day })
    }
  }
  return points
}

function bingDay(value: unknown) {
  if (typeof value !== "string") return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const match = /\/Date\((\d+)/.exec(value)
  if (!match) return ""
  const date = new Date(Number(match[1]))
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

async function googleToken(env: Env, scope: string, fetchImpl: FetchLike) {
  const bearer = env.GSC_ACCESS_TOKEN?.trim() || env.GOOGLE_ACCESS_TOKEN?.trim() || ""
  if (bearer) return bearer
  const account = serviceAccount(env)
  if (!account) return null
  const assertion = signServiceAccountJwt({ ...account, scope })
  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
  })
  if (!response.ok) return null
  const json = await response.json() as { access_token?: unknown }
  return typeof json.access_token === "string" ? json.access_token : null
}

function isoDays(now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export async function readTrafficProviders(env: Env, fetchImpl: FetchLike, now = new Date()): Promise<KpiRow[]> {
  const rows: KpiRow[] = []
  const { start, end } = isoDays(now)
  const site = env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim() || ""
  if (site && trafficProviderFlags(env).find((flag) => flag.id === "gsc")?.configured) {
    const token = await googleToken(env, GSC_SCOPE, fetchImpl)
    if (token) {
      const response = await fetchImpl(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start, endDate: end, dimensions: ["date"], rowLimit: 14 }),
      })
      if (response.ok) rows.push(...metricsFromSearchConsole(await response.json()))
    }
  }
  const property = env.GA4_PROPERTY_ID?.trim().replace(/^properties\//, "") || ""
  if (property && trafficProviderFlags(env).find((flag) => flag.id === "ga4")?.configured) {
    const token = await googleToken(env, GA4_SCOPE, fetchImpl)
    if (token) {
      const response = await fetchImpl(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property)}:runReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: start, endDate: end }],
          metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        }),
      })
      if (response.ok) rows.push(...metricsFromGa4(await response.json(), start, end))
    }
  }
  const bingKey = env.BING_WEBMASTER_API_KEY?.trim() || ""
  const bingSite = env.BING_SITE_URL?.trim() || ""
  if (bingKey && bingSite) {
    const url = `https://ssl.bing.com/webmaster/api.svc/json/GetRankAndTrafficStats?siteUrl=${encodeURIComponent(bingSite)}&apikey=${encodeURIComponent(bingKey)}`
    const response = await fetchImpl(url)
    if (response.ok) rows.push(...metricsFromBing(await response.json()))
  }
  return rows
}

export async function submitIndexNow(env: Env, urls: string[], fetchImpl: FetchLike, siteUrl: string) {
  const key = indexNowKey(env)
  if (!key) return { ok: false, summary: "IndexNow is not configured. Nothing was submitted." }
  let host = ""
  try {
    host = new URL(siteUrl).host
  } catch {
    return { ok: false, summary: "The site URL is not set. Nothing was submitted." }
  }
  const keyLocation = `${siteUrl.replace(/\/$/, "")}/api/indexnow/${key}`
  const payload = indexNowPayload({ host, key, keyLocation, urls })
  if (!payload.urlList.length) return { ok: false, summary: "No https URL was available. Nothing was submitted." }
  const response = await fetchImpl("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) return { ok: false, summary: "IndexNow did not accept the submission. Nothing was marked as indexed." }
  return { ok: true, summary: `IndexNow accepted ${payload.urlList.length} URL${payload.urlList.length === 1 ? "" : "s"}. That is a submission, not a ranking.` }
}

export function auditLines(env: Env = process.env) {
  const flags = trafficProviderFlags(env)
  return flags.map((flag) => `${flag.id}: ${flag.configured ? "configured" : "not configured"} (${flag.mode})`).join("\n")
}
