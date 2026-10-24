import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "crypto"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

export const SOCIAL_PROVIDERS = [
  { id: "facebook", label: "Facebook", env: ["META_APP_ID", "META_APP_SECRET"] },
  { id: "instagram", label: "Instagram", env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"] },
  { id: "linkedin", label: "LinkedIn", env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] },
  { id: "x", label: "X", env: ["X_CLIENT_ID", "X_CLIENT_SECRET"] },
  { id: "tiktok", label: "TikTok", env: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] },
  { id: "youtube", label: "YouTube", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "google", label: "Google Business Profile", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
] as const

export type SocialProviderId = (typeof SOCIAL_PROVIDERS)[number]["id"]

const HOSTS = new Set(["www.digimark101.com", "digimark101.com", "localhost", "127.0.0.1"])

export function socialTokenKey() {
  const raw = process.env.SOCIAL_TOKEN_KEY?.trim() || ""
  if (!raw) return null
  const decoded = Buffer.from(raw, "base64")
  if (decoded.length === 32) return decoded
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex")
  return null
}

export function missingSocialEnv(providerId: string) {
  const provider = SOCIAL_PROVIDERS.find((item) => item.id === providerId)
  const missing = provider ? provider.env.filter((name) => !process.env[name]?.trim()) : ["provider"]
  if (!socialTokenKey()) missing.push("SOCIAL_TOKEN_KEY")
  return missing
}

export function encryptSecret(plain: string) {
  const key = socialTokenKey()
  if (!key) throw new Error("SOCIAL_TOKEN_KEY")
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`
}

export function decryptSecret(packed: string) {
  const key = socialTokenKey()
  const parts = packed.split(":")
  if (!key || parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") return null
  const iv = Buffer.from(parts[2], "base64url")
  const tag = Buffer.from(parts[3], "base64url")
  const ciphertext = Buffer.from(parts[4], "base64url")
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export function siteOrigin(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall through to the request host when the env value is not a URL.
    }
  }
  if (request) {
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim()
    const hostname = host.split(":")[0].toLowerCase()
    const proto = (request.headers.get("x-forwarded-proto") || "https").split(",")[0].trim()
    if (HOSTS.has(hostname) && (proto === "https" || hostname === "localhost" || hostname === "127.0.0.1")) {
      return `${proto}://${host}`
    }
  }
  return "https://www.digimark101.com"
}

export function signOAuthState(userId: string) {
  const key = socialTokenKey()
  if (!key) throw new Error("SOCIAL_TOKEN_KEY")
  const body = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + 10 * 60 * 1000 })).toString("base64url")
  const mac = createHmac("sha256", key).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function verifyOAuthState(state: string | null) {
  const key = socialTokenKey()
  if (!key || !state || !state.includes(".")) return null
  const [body, mac] = state.split(".")
  if (!body || !mac) return null
  const expected = createHmac("sha256", key).update(body).digest("base64url")
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { u?: string; e?: number }
    if (!parsed.u || !parsed.e || parsed.e < Date.now()) return null
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.u)) return null
    return parsed.u
  } catch {
    return null
  }
}

export async function savePlatformConnection(input: {
  userId: string
  platform: string
  accessToken: string
  refreshToken?: string | null
  expiresAt?: string | null
  scopes?: string | null
  platformUserId?: string | null
  accountName?: string | null
  extra?: Record<string, string>
  metadata?: Record<string, string | null>
}) {
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, error: "service_role" }
  if (!socialTokenKey()) return { ok: false as const, error: "SOCIAL_TOKEN_KEY" }
  const access_token = encryptSecret(JSON.stringify({
    access: input.accessToken,
    refresh: input.refreshToken || "",
    extra: input.extra || {},
  }))
  const { error } = await admin.from("platform_tokens").upsert({
    user_id: input.userId,
    platform: input.platform,
    access_token,
    refresh_token: null,
    token_expires_at: input.expiresAt || null,
    scopes: input.scopes || null,
    platform_user_id: input.platformUserId || null,
    platform_account_name: input.accountName || null,
    metadata: input.metadata || {},
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,platform" })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export function connectRedirect(origin: string, platform: string, params: Record<string, string>) {
  const url = new URL("/studio/social", origin)
  url.searchParams.set("connect", platform)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value.slice(0, 180))
  return url.toString()
}
