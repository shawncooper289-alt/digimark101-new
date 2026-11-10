/** Keep login responsive when the shared auth provider is offline or suspended. */
export async function authFetch(input: string, init: RequestInit = {}) {
  try {
    return await fetch(input, { ...init, signal: AbortSignal.timeout(8000), cache: "no-store" })
  } catch {
    return Response.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 })
  }
}
