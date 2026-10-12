export function validPublicConfig(url: string | undefined, key: string | undefined) {
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) || !key) return false
  if (key.startsWith('sb_publishable_')) return true
  try {
    return JSON.parse(atob(key.split('.')[1])).role === 'anon'
  } catch {
    return false
  }
}
