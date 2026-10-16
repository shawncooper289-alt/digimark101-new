const hits = new Map<string, { count: number; started: number }>()

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

export function tooManyRequests(ip: string, limit = 20) {
  const now = Date.now()
  const current = hits.get(ip)
  if (!current || now - current.started > 60_000) {
    hits.set(ip, { count: 1, started: now })
    return false
  }
  current.count += 1
  return current.count > limit
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}
