export type DeskHeaderChoice = {
  headers: Record<string, string>
  /** The server key was sent to the database and rejected. Counts then use the owner sign-in. */
  rejectedService: boolean
}

/** Same rule as office-store: new sb_ keys are not JWTs and stay in the apikey header only. */
function keyHeaders(key: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { apikey: key, ...extra }
  if (key && !key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`
  }
  return headers
}

function projectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0]?.toLowerCase() || ""
  } catch {
    return ""
  }
}

function decodeJwtPayload(key: string) {
  const part = key.split(".")[1]
  if (!part) return null
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(json) as { ref?: string; role?: string }
  } catch {
    return null
  }
}

/**
 * A service key this office may send.
 * Publishable keys, blank values, and JWTs minted for another project are ignored.
 * A secret key (sb_secret_) cannot be checked until the database accepts or rejects it.
 */
export function serviceCredential(url: string, raw: string | undefined) {
  const key = (raw || "").trim()
  if (!key || key.startsWith("sb_publishable_")) return ""
  if (key.startsWith("sb_secret_")) return key
  const parts = key.split(".")
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return ""
  const payload = decodeJwtPayload(key)
  if (!payload) return ""
  if (payload.role && payload.role !== "service_role") return ""
  const ref = typeof payload.ref === "string" ? payload.ref.toLowerCase() : ""
  const host = projectRef(url)
  if (ref && host && ref !== host) return ""
  return key
}

export async function chooseDeskHeaders(input: {
  url: string
  service: string
  anon: string
  ownerAccess: string
  probe: (headers: Record<string, string>) => Promise<number>
  serviceState: "unknown" | "ok" | "rejected"
}): Promise<DeskHeaderChoice & { serviceState: "unknown" | "ok" | "rejected" }> {
  const usable = serviceCredential(input.url, input.service)
  const ignored = Boolean(input.service.trim()) && !usable
  let serviceState = input.serviceState
  if (usable && serviceState === "unknown") {
    const status = await input.probe(keyHeaders(usable))
    serviceState = status === 401 || status === 403 ? "rejected" : "ok"
  }
  const rejectedService = ignored || (Boolean(usable) && serviceState === "rejected")
  if (usable && serviceState === "ok") {
    return { headers: keyHeaders(usable), rejectedService: false, serviceState }
  }
  if (input.anon && input.ownerAccess) {
    return {
      headers: { apikey: input.anon, Authorization: `Bearer ${input.ownerAccess}` },
      rejectedService,
      serviceState,
    }
  }
  return { headers: keyHeaders(input.anon), rejectedService: false, serviceState }
}
