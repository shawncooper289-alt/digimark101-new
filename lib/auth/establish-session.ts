"use client"

import type { EmailOtpType } from "@supabase/supabase-js"
import { createSupabaseBrowser } from "@/lib/supabase/browser"

const OTP_TYPES = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"])

export type AuthLinkResult =
  | { ok: true; type: string | null }
  | { ok: false; reason: "unconfigured" | "invalid" | "missing" }

/** Only same-site paths. Reject protocol-relative and backslash tricks. */
export function safeNextPath(value: string | null, fallback = "/studio") {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  if (value.includes("\\") || value.includes("\n") || value.includes("\r")) return fallback
  return value
}

function otpType(value: string): EmailOtpType | null {
  const type = value.toLowerCase()
  return OTP_TYPES.has(type as EmailOtpType) ? (type as EmailOtpType) : null
}

/**
 * Turn an email confirmation, magic link, or recovery link into a cookie session.
 * Supports hash tokens, PKCE `code`, and `token_hash` + `type`.
 * The URL is cleared so the one-time secrets are not left in history.
 */
export async function establishSessionFromUrl(): Promise<AuthLinkResult> {
  const query = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
  const params = new URLSearchParams(hash)
  const error = query.get("error_description") || query.get("error") || params.get("error_description") || params.get("error")
  const code = query.get("code")
  const tokenHash = query.get("token_hash") || params.get("token_hash")
  const type = query.get("type") || params.get("type") || ""
  const accessToken = params.get("access_token") || query.get("access_token")
  const refreshToken = params.get("refresh_token") || query.get("refresh_token")
  const hasLink = Boolean(error || code || tokenHash || accessToken || refreshToken)

  window.history.replaceState({}, "", window.location.pathname)

  if (!hasLink) return { ok: false, reason: "missing" }
  if (error) return { ok: false, reason: "invalid" }

  const supabase = createSupabaseBrowser({ detectSessionInUrl: false })
  if (!supabase) return { ok: false, reason: "unconfigured" }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) return { ok: false, reason: "invalid" }
    return { ok: true, type: type || null }
  }

  if (tokenHash) {
    const otp = otpType(type)
    if (!otp) return { ok: false, reason: "invalid" }
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otp })
    if (verifyError) return { ok: false, reason: "invalid" }
    return { ok: true, type: otp }
  }

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    if (sessionError) return { ok: false, reason: "invalid" }
    return { ok: true, type: type || null }
  }

  return { ok: false, reason: "invalid" }
}
