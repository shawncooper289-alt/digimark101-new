import { cookies } from "next/headers"

const COOKIE = "ava_office"

/** sb_publishable_ and sb_secret_ keys are not JWTs and must not be sent as Bearer. */
export function supabaseKeyHeaders(key: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { apikey: key, ...extra }
  if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`
  }
  return headers
}

type TokenBag = { access: string; refresh: string; exp: number }

export function ownerEmails() {
  return (process.env.OWNER_EMAIL || "")
    .split(/[,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function projectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0]?.toLowerCase() || ""
  } catch {
    return ""
  }
}

function legacyAnonMatches(key: string, ref: string) {
  const part = key.split(".")[1]
  if (!part || !ref) return false
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/")
    const json = JSON.parse(atob(padded)) as { role?: string; ref?: string; v?: string }
    if (json.v === "v2" || json.role !== "anon") return false
    return json.ref?.toLowerCase() === ref
  } catch {
    return false
  }
}

/** Use the publishable key for this URL. Skip anon JWTs minted for a different project. */
function publicKeyFor(url: string, publishable: string | undefined, anon: string | undefined) {
  const ref = projectRef(url)
  const current = publishable?.trim() || ""
  if (current.startsWith("sb_publishable_")) return current
  const legacy = anon?.trim() || ""
  if (legacy.startsWith("sb_publishable_")) return legacy
  if (legacyAnonMatches(legacy, ref)) return legacy
  return ""
}

export function officeConfig() {
  const primaryUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "")
  const digimarkUrl = (process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || "").trim().replace(/\/$/, "")
  const fallbackUrl = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "")
  const paired = [
    [primaryUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    [digimarkUrl, process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY, process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY],
    [fallbackUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ] as const
  let url = ""
  let anon = ""
  for (const [candidate, publishable, legacy] of paired) {
    if (!candidate) continue
    const key = publicKeyFor(candidate, publishable, legacy)
    if (key) {
      url = candidate
      anon = key
      break
    }
  }
  const service =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.Supabase_service_roll ||
    ""
  const emails = ownerEmails()
  return {
    url,
    anon,
    service,
    owner: emails[0] || "",
    emails,
    configured: Boolean(url && anon && emails.length),
  }
}

export function missingOfficeEnv() {
  const config = officeConfig()
  const missing: string[] = []
  if (!config.url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!config.anon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!config.service) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  if (!config.owner) missing.push("OWNER_EMAIL")
  if (!process.env.LEAD_HASH_SALT?.trim()) missing.push("LEAD_HASH_SALT")
  if (!process.env.PAYPAL_CLIENT_ID?.trim()) missing.push("PAYPAL_CLIENT_ID")
  if (!process.env.PAYPAL_CLIENT_SECRET?.trim()) missing.push("PAYPAL_CLIENT_SECRET")
  if (!process.env.PAYPAL_WEBHOOK_ID?.trim()) missing.push("PAYPAL_WEBHOOK_ID")
  if (!process.env.XAI_API_KEY?.trim() && !process.env.AVA_LLM_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim()) {
    missing.push("XAI_API_KEY")
  }
  return missing
}

export function officeCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function encodeOfficeSession(access: string, refresh: string, expiresIn: number) {
  const bag: TokenBag = { access, refresh, exp: Date.now() + expiresIn * 1000 }
  return JSON.stringify(bag)
}

async function authUser(url: string, anon: string, access: string) {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${access}` },
    cache: "no-store",
  })
  if (!response.ok) return null
  const data = (await response.json()) as { id?: string; email?: string }
  if (!data.id || !data.email) return null
  return { id: data.id, email: data.email.trim().toLowerCase() }
}

export async function readVisitorMode() {
  const { url, service, owner, configured } = officeConfig()
  if (!configured) return { visitorMode: false, configured: false }
  const response = await fetch(`${url}/rest/v1/rpc/owner_office_state`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, { "Content-Type": "application/json" }),
    body: JSON.stringify({ owner_email: owner }),
    cache: "no-store",
  })
  if (!response.ok) return { visitorMode: false, configured: true }
  const data = (await response.json()) as boolean
  return { visitorMode: data === true, configured: true }
}

export async function saveVisitorMode(ownerId: string, visitorMode: boolean) {
  const { url, service, configured } = officeConfig()
  if (!configured) return false
  const response = await fetch(`${url}/rest/v1/owner_office_appearance?on_conflict=owner_id`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    }),
    body: JSON.stringify({
      owner_id: ownerId,
      visitor_mode: visitorMode,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  })
  return response.ok
}

export async function readOfficeOwner() {
  const { url, anon, owner } = officeConfig()
  if (!url || !anon || !owner) return null
  const jar = await cookies()
  const raw = jar.get(COOKIE)?.value
  if (!raw) return null
  let bag: TokenBag
  try {
    bag = JSON.parse(raw) as TokenBag
  } catch {
    return null
  }
  if (!bag.access) return null
  const user = await authUser(url, anon, bag.access)
  const emails = ownerEmails()
  if (!user || !emails.includes(user.email)) return null
  return user
}

const attempts = new Map<string, { count: number; reset: number }>()

export function officeSignInAllowed(ip: string) {
  const now = Date.now()
  const current = attempts.get(ip)
  if (!current || current.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 10 * 60 * 1000 })
    return true
  }
  if (current.count >= 8) return false
  current.count += 1
  return true
}
