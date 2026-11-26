export const STORE_APEX = "appdm101.store"
export const STORE_ORIGIN = "https://appdm101.store"

const STORE_HOSTS = new Set([STORE_APEX, `www.${STORE_APEX}`])

const PASS_PREFIXES = ["/api", "/_next", "/auth"]
const PASS_EXACT = new Set([
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/llms.txt",
  "/llms-full.txt",
])

export function bareHost(value: string | null | undefined) {
  return (value || "").split(",")[0]?.trim().split(":")[0]?.toLowerCase() || ""
}

export function isStoreHost(value: string | null | undefined) {
  return STORE_HOSTS.has(bareHost(value))
}

/** Path to rewrite to on the store domain, or null to leave the request alone. */
export function storeRewritePath(host: string | null | undefined, pathname: string) {
  if (!isStoreHost(host)) return null
  if (PASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null
  if (PASS_EXACT.has(pathname)) return null
  if (pathname === "/store" || pathname.startsWith("/store/")) return null
  if (pathname === "/") return "/store"
  return `/store${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

/** Relative next path after sign-in. Refuses off-site targets. */
export function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return "/studio"
  const path = value.split("?")[0] || ""
  if (path.startsWith("/store") || path.startsWith("/start") || path === "/studio/setup") return value.slice(0, 300)
  return "/studio"
}
