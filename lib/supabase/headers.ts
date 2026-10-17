/**
 * New Supabase keys (sb_publishable_ / sb_secret_) are not JWTs.
 * They belong in the apikey header only. Legacy JWT keys still use Bearer.
 */
export function supabaseKeyHeaders(key: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { apikey: key, ...extra }
  if (!key.startsWith("sb_publishable_") && !key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`
  }
  return headers
}
