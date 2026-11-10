const OFFICE_ORIGIN = "https://www.avaskye.online"

function developmentOrigin(request: Request) {
  if (process.env.NODE_ENV !== "development") return null
  const url = new URL(request.url)
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin
  return null
}

/** Always return email links to the real office, never a deployment or forwarded host. */
export function officeCallbackUrl(request: Request) {
  return `${developmentOrigin(request) || OFFICE_ORIGIN}/auth/callback`
}

export function officeResetUrl(request: Request) {
  return `${developmentOrigin(request) || OFFICE_ORIGIN}/reset-password`
}

export function missingOfficeAuthEnv() {
  const missing: string[] = []
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.SUPABASE_URL
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY
  if (!url?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!anon?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!process.env.OWNER_EMAIL?.trim()) missing.push("OWNER_EMAIL")
  return missing
}
