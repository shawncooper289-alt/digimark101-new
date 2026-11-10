"use client"

export type OfficeLinkResult = "signed-in" | "rejected" | "failed" | "missing"

/** Exchange a one-time office email link exactly once, then scrub it from the address bar. */
export async function consumeOfficeLink(): Promise<{ result: OfficeLinkResult; type: string }> {
  const query = new URLSearchParams(window.location.search)
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
  const params = new URLSearchParams(hash)
  const error = query.get("error_description") || query.get("error") || params.get("error_description") || params.get("error")
  const tokenHash = query.get("token_hash") || params.get("token_hash")
  const type = (query.get("type") || params.get("type") || "").toLowerCase()
  const code = query.get("code") || params.get("code")
  const accessToken = params.get("access_token") || query.get("access_token")
  const refreshToken = params.get("refresh_token") || query.get("refresh_token")
  const expiresIn = params.get("expires_in") || query.get("expires_in")
  window.history.replaceState({}, "", window.location.pathname)
  if (error) return { result: "rejected", type }

  const signal = AbortSignal.timeout(20000)
  try {
    if (tokenHash) {
      const verified = await fetch("/api/office/session/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, type: type || "magiclink" }),
        signal,
      })
      return { result: verified.ok ? "signed-in" : "failed", type }
    }
    if (code) {
      const exchanged = await fetch("/api/office/session/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal,
      })
      return { result: exchanged.ok ? "signed-in" : "failed", type }
    }
    if (accessToken && refreshToken) {
      const response = await fetch("/api/office/session/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: Number(expiresIn) || 3600,
        }),
        signal,
      })
      return { result: response.ok ? "signed-in" : "failed", type }
    }
  } catch {
    return { result: "failed", type }
  }
  return { result: "missing", type }
}
