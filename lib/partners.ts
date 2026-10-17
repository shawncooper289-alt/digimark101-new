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

export function partnerLinks(): PartnerLink[] {
  return [
    { href: partnerHref(process.env.SUPABASE_AFFILIATE_URL), label: "Supabase" },
    { href: partnerHref(process.env.VERCEL_AFFILIATE_URL), label: "Vercel" },
  ].filter((item): item is PartnerLink => Boolean(item.href))
}
