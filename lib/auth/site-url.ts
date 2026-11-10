const CUSTOMER_ORIGIN = "https://www.digimark101.com"

function localhostOrigin(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return url.origin
  } catch {
    return null
  }
  return null
}

/** Email links use the public production domain, never a temporary deployment URL. */
export function publicSiteOrigin() {
  if (process.env.NODE_ENV === "development") {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (configured) {
      const origin = localhostOrigin(configured)
      if (origin) return origin
    }
    if (typeof window !== "undefined") {
      const origin = localhostOrigin(window.location.origin)
      if (origin) return origin
    }
  }
  return CUSTOMER_ORIGIN
}

export function authCallbackUrl() {
  return `${publicSiteOrigin()}/auth/callback`
}

export function resetPasswordUrl() {
  return `${publicSiteOrigin()}/reset-password`
}
