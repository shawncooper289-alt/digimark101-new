function clean(value: string | undefined) {
  return (value || "").trim()
}

function projectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0]?.toLowerCase() || ""
  } catch {
    return ""
  }
}

/**
 * Legacy anon JWTs embed the project ref. A key minted for another project
 * is what Auth returns as "Invalid API key". Encrypted Vercel envelopes
 * are not keys either.
 */
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

function keyForProject(url: string, publishable: string | undefined, anon: string | undefined) {
  const ref = projectRef(url)
  if (!ref) return ""
  const current = clean(publishable)
  if (current.startsWith("sb_publishable_")) return current
  const legacy = clean(anon)
  if (legacy.startsWith("sb_publishable_")) return legacy
  if (legacyAnonMatches(legacy, ref)) return legacy
  return ""
}

export function supabasePublicConfig() {
  const pairs: Array<[string | undefined, string | undefined, string | undefined]> = [
    [
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ],
    [
      process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL,
      process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY,
      process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY,
    ],
  ]
  for (const [rawUrl, publishable, anon] of pairs) {
    const url = clean(rawUrl).replace(/\/$/, "")
    const key = keyForProject(url, publishable, anon)
    if (url && key) return { url, key }
  }
  return null
}
