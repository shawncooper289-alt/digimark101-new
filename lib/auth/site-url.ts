/** Email links use the public production domain, never a temporary deployment URL. */
export function publicSiteOrigin() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const url = new URL(window.location.origin)
    if (["localhost", "127.0.0.1"].includes(url.hostname)) return url.origin
  }
  return "https://www.digimark101.com"
}

export function authCallbackUrl() {
  return `${publicSiteOrigin()}/auth/callback`
}

export function resetPasswordUrl() {
  return `${publicSiteOrigin()}/reset-password`
}
