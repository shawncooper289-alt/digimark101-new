import { createSupabaseAdmin } from "@/lib/supabase/admin"

export type PartnerLink = { href: string; label: string }

function partnerHref(value: string | undefined) {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    return url.toString()
  } catch {
    return null
  }
}

function envLinks(): PartnerLink[] {
  return [
    { href: partnerHref(process.env.SUPABASE_AFFILIATE_URL), label: "Supabase" },
    { href: partnerHref(process.env.VERCEL_AFFILIATE_URL), label: "Vercel" },
  ].filter((item): item is PartnerLink => Boolean(item.href))
}

export async function partnerLinks(): Promise<PartnerLink[]> {
  const fallback = envLinks()
  const admin = createSupabaseAdmin()
  if (!admin) return fallback
  const { data, error } = await admin.from("affiliate_links").select("label, href, enabled")
  if (error || !data?.length) return fallback
  const stored = data
    .filter((row) => row.enabled === true)
    .map((row) => ({ href: partnerHref(typeof row.href === "string" ? row.href : undefined), label: String(row.label || "") }))
    .filter((item): item is PartnerLink => Boolean(item.href && item.label))
  return stored.length ? stored : fallback
}
