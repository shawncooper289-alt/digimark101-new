/** Public site origin for auth emails. Prefer the configured site URL, then the browser. */
export function publicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall through to the browser origin when the env value is not a URL.
    }
  }
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin
  return "https://www.digimark101.com"
}

export function authCallbackUrl() {
  return `${publicSiteOrigin()}/auth/callback`
}

export function resetPasswordUrl() {
  return `${publicSiteOrigin()}/reset-password`
}
