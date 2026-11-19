type Env = Record<string, string | undefined>

/**
 * Cloudflare Turnstile. When TURNSTILE_SECRET_KEY is unset, forms stay open
 * and the widget is not shown. When it is set, a missing or bad token is rejected.
 */
export async function turnstileOk(token: unknown, ip: string, env: Env = process.env, fetchImpl: typeof fetch = fetch) {
  const secret = env.TURNSTILE_SECRET_KEY?.trim() || ""
  if (!secret) return true
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== "unknown") body.set("remoteip", ip)
    const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return false
    const data = (await response.json()) as { success?: unknown }
    return data.success === true
  } catch {
    return false
  }
}

export const TURNSTILE_REJECTED = "Confirm you are a person, then try again."
