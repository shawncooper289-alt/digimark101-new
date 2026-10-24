import { createCipheriv, createHmac, randomBytes } from "crypto"
import { officeConfig, supabaseKeyHeaders } from "@/lib/office-store"

export const OFFICE_SOCIAL = [
  { id: "facebook", label: "Facebook", env: ["META_APP_ID", "META_APP_SECRET"] },
  { id: "instagram", label: "Instagram", env: ["INSTAGRAM_APP_ID", "INSTAGRAM_APP_SECRET"] },
  { id: "linkedin", label: "LinkedIn", env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] },
  { id: "x", label: "X", env: ["X_CLIENT_ID", "X_CLIENT_SECRET"] },
  { id: "tiktok", label: "TikTok", env: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] },
  { id: "youtube", label: "YouTube", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "google", label: "Google Business Profile", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
] as const

export type OfficeSocialId = (typeof OFFICE_SOCIAL)[number]["id"]

const HOSTS = new Set(["www.avaskye.online", "avaskye.online", "localhost", "127.0.0.1"])

export function officeSocialKey() {
  const raw = process.env.SOCIAL_TOKEN_KEY?.trim() || ""
  if (!raw) return null
  const decoded = Buffer.from(raw, "base64")
  if (decoded.length === 32) return decoded
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex")
  return null
}

export function missingOfficeSocial(id: string) {
  const provider = OFFICE_SOCIAL.find((item) => item.id === id)
  const missing = provider ? provider.env.filter((name) => !process.env[name]?.trim()) : ["provider"]
  if (!officeSocialKey()) missing.push("SOCIAL_TOKEN_KEY")
  return missing
}

export function officeOrigin(request: Request) {
  const requestUrl = new URL(request.url)
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host).split(",")[0].trim()
  const hostname = host.split(":")[0].toLowerCase()
  const proto = (request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "")).split(",")[0].trim()
  if ((HOSTS.has(hostname) || hostname.endsWith(".vercel.app")) && (proto === "https" || hostname === "localhost" || hostname === "127.0.0.1")) {
    return `${proto}://${host}`
  }
  return (process.env.OFFICE_PUBLIC_URL || "https://www.avaskye.online").replace(/\/$/, "")
}

export function signOfficeState(userId: string) {
  const key = officeSocialKey()
  if (!key) throw new Error("SOCIAL_TOKEN_KEY")
  const body = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + 10 * 60 * 1000 })).toString("base64url")
  const mac = createHmac("sha256", key).update(body).digest("base64url")
  return `${body}.${mac}`
}

export function verifyOfficeState(state: string | null) {
  const key = officeSocialKey()
  if (!key || !state || !state.includes(".")) return null
  const [body, mac] = state.split(".")
  if (!body || !mac) return null
  const expected = createHmac("sha256", key).update(body).digest("base64url")
  if (mac !== expected) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { u?: string; e?: number }
    if (!parsed.u || !parsed.e || parsed.e < Date.now()) return null
    return parsed.u
  } catch {
    return null
  }
}

export function encryptOfficeSecret(plain: string) {
  const key = officeSocialKey()
  if (!key) throw new Error("SOCIAL_TOKEN_KEY")
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`
}

export async function saveOfficeConnection(input: {
  userId: string
  platform: string
  accessToken: string
  refreshToken?: string | null
  expiresAt?: string | null
  scopes?: string | null
  platformUserId?: string | null
  accountName?: string | null
}) {
  const { url, service } = officeConfig()
  if (!url || !service) return false
  const access_token = encryptOfficeSecret(JSON.stringify({
    access: input.accessToken,
    refresh: input.refreshToken || "",
  }))
  const response = await fetch(`${url}/rest/v1/platform_tokens?on_conflict=user_id,platform`, {
    method: "POST",
    headers: supabaseKeyHeaders(service, {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify({
      user_id: input.userId,
      platform: input.platform,
      access_token,
      refresh_token: null,
      token_expires_at: input.expiresAt || null,
      scopes: input.scopes || null,
      platform_user_id: input.platformUserId || null,
      platform_account_name: input.accountName || null,
      metadata: {},
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  })
  return response.ok
}
