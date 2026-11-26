import "server-only"

import { createSupabaseAdmin } from "@/lib/supabase/admin"

export type PublicOffer = {
  slug: string
  name: string
  kind: "upsell" | "bump" | "upgrade"
  headline: string
  body: string
  cta: string
  amountCents: number | null
}

function kindOf(value: string): PublicOffer["kind"] | null {
  if (value === "upsell" || value === "bump" || value === "upgrade") return value
  return null
}

export async function publishedOffers() {
  const admin = createSupabaseAdmin()
  if (!admin) return [] as PublicOffer[]
  const funnels = await admin.from("funnels").select("id, name, slug, status, surface, offer_kind").eq("surface", "ink").eq("status", "published")
  if (funnels.error || !funnels.data) return []
  const ids = funnels.data.map((row) => String((row as { id?: string }).id || "")).filter(Boolean)
  if (!ids.length) return []
  const pages = await admin.from("funnel_pages").select("funnel_id, headline, body, cta, amount_cents, position").in("funnel_id", ids).order("position", { ascending: true })
  if (pages.error) return []
  const first = new Map<string, Record<string, unknown>>()
  for (const page of (pages.data ?? []) as Record<string, unknown>[]) {
    const id = String(page.funnel_id || "")
    if (id && !first.has(id)) first.set(id, page)
  }
  const offers: PublicOffer[] = []
  for (const row of funnels.data as Record<string, unknown>[]) {
    const slug = String(row.slug || "")
    const kind = kindOf(String(row.offer_kind || ""))
    const page = first.get(String(row.id || ""))
    if (!slug || !kind || !page) continue
    const amount = page.amount_cents
    offers.push({
      slug,
      name: String(row.name || slug),
      kind,
      headline: String(page.headline || row.name || ""),
      body: String(page.body || ""),
      cta: String(page.cta || "Continue"),
      amountCents: typeof amount === "number" ? amount : null,
    })
  }
  return offers
}

export async function publishedOffer(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null
  const offers = await publishedOffers()
  return offers.find((offer) => offer.slug === slug) ?? null
}

export async function publishedProducts() {
  const admin = createSupabaseAdmin()
  if (!admin) return []
  const { data, error } = await admin
    .from("products")
    .select("id, slug, name, description, amount_cents, kind, credits, published")
    .eq("published", true)
  if (error || !data) return []
  return (data as Record<string, unknown>[])
    .filter((row) => typeof row.slug === "string" && row.slug)
    .map((row) => ({
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name || ""),
      description: String(row.description || ""),
      amountCents: Number(row.amount_cents) || 0,
      kind: String(row.kind || "one_time"),
      credits: Number(row.credits) || 0,
    }))
}
