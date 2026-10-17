export function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || ""
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY ||
    ""
  if (!url || !key) return null
  return { url, key }
}
