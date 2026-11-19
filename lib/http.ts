/**
 * Shared request limiter.
 * Upstash Redis is the durable count when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (the names the Vercel Marketplace
 * Upstash integration writes). Otherwise each server keeps its own minute
 * window, which is the previous behavior.
 */

const memory = new Map<string, { count: number; started: number }>()

type Env = Record<string, string | undefined>

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

export function rateLimitConfig(env: Env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "") || ""
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim() || ""
  if (!url || !token) return null
  return { url, token }
}

export function resetRateLimitsForTests() {
  memory.clear()
}

function remember(key: string, windowMs: number, now: number) {
  if (memory.size > 2000) {
    for (const [stored, hit] of memory) {
      if (now - hit.started > 24 * 60 * 60 * 1000) memory.delete(stored)
    }
  }
  const current = memory.get(key)
  if (!current || now - current.started >= windowMs) {
    memory.set(key, { count: 1, started: now })
    return 1
  }
  current.count += 1
  return current.count
}

async function redisCount(key: string, windowMs: number, env: Env, fetchImpl: FetchLike) {
  const config = rateLimitConfig(env)
  if (!config) return null
  const redisKey = `dm:rl:${key}`
  const response = await fetchImpl(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(windowMs), "NX"],
    ]),
    signal: AbortSignal.timeout(1500),
  })
  if (!response.ok) return null
  const data = await response.json()
  const count = Array.isArray(data) ? (data[0] as { result?: unknown } | undefined)?.result : null
  return typeof count === "number" ? count : null
}

export async function tooManyRequests(
  key: string,
  limit = 20,
  windowMs = 60_000,
  deps: { env?: Env; fetchImpl?: FetchLike; now?: number } = {},
) {
  const env = deps.env ?? process.env
  const now = deps.now ?? Date.now()
  if (rateLimitConfig(env)) {
    try {
      const count = await redisCount(key, windowMs, env, deps.fetchImpl ?? fetch)
      if (typeof count === "number") return count > limit
    } catch {
      // A Redis miss uses the in-memory window so one outage does not open the route.
    }
  }
  return remember(key, windowMs, now) > limit
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
