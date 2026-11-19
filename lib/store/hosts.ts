export const STORE_APEX = "appdm101.store"
export const STORE_ORIGIN = "https://appdm101.store"

export const SURFACES = [
  { id: "store", hosts: ["appdm101.store", "www.appdm101.store"], prefix: "/store", origin: "https://appdm101.store" },
  { id: "leads", hosts: ["appdm101.online", "www.appdm101.online"], prefix: "/leads", origin: "https://appdm101.online" },
  { id: "offers", hosts: ["appdm101.ink", "www.appdm101.ink"], prefix: "/offers", origin: "https://appdm101.ink" },
] as const

export type SurfaceId = (typeof SURFACES)[number]["id"]

const STORE_HOSTS = new Set<string>(SURFACES[0].hosts)

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

export function surfaceForHost(value: string | null | undefined) {
  const host = bareHost(value)
  return SURFACES.find((surface) => (surface.hosts as readonly string[]).includes(host)) ?? null
}

function passThrough(pathname: string) {
  if (PASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true
  return PASS_EXACT.has(pathname)
}

/** Rewrite a spare domain onto its path, or null to leave the request alone. */
export function surfaceRewritePath(host: string | null | undefined, pathname: string) {
  const surface = surfaceForHost(host)
  if (!surface || passThrough(pathname)) return null
  if (pathname === surface.prefix || pathname.startsWith(`${surface.prefix}/`)) return null
  if (pathname === "/") return surface.prefix
  return `${surface.prefix}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

/** Path to rewrite to on the store domain, or null to leave the request alone. */
export function storeRewritePath(host: string | null | undefined, pathname: string) {
  if (!isStoreHost(host)) return null
  return surfaceRewritePath(host, pathname)
}

/** Relative next path after sign-in. Refuses off-site targets. */
export function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return "/studio"
  const path = value.split("?")[0] || ""
  if (path.startsWith("/store") || path.startsWith("/leads") || path.startsWith("/offers") || path.startsWith("/start") || path === "/studio/setup") {
    return value.slice(0, 300)
  }
  return "/studio"
}
