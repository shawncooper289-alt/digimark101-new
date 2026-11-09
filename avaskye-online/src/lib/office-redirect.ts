/** Always return email links to the real office, never a deployment/forwarded host. */
export function officeCallbackUrl(request: Request) {
  const url = new URL(request.url)
  if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
    return `${url.origin}/auth/callback`
  }
  return "https://www.avaskye.online/auth/callback"
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
