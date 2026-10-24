const OFFICE_HOSTS = new Set(["www.avaskye.online", "avaskye.online", "localhost", "127.0.0.1"])

function hostnameOf(host: string) {
  return host.split(":")[0].trim().toLowerCase()
}

/** Magic-link redirect for the host that asked, limited to the founder office. */
export function officeCallbackUrl(request: Request) {
  const requestUrl = new URL(request.url)
  const forwarded = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host
  const hostname = hostnameOf(forwarded)
  const proto = (request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "")).split(",")[0].trim()
  const allowed = OFFICE_HOSTS.has(hostname) || hostname.endsWith(".vercel.app")
  if (allowed && (proto === "https" || hostname === "localhost" || hostname === "127.0.0.1")) {
    return `${proto}://${forwarded.split(",")[0].trim()}/auth/callback`
  }
  const configured = (process.env.OFFICE_PUBLIC_URL || "https://www.avaskye.online").replace(/\/$/, "")
  return `${configured}/auth/callback`
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
