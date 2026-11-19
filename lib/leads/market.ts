import "server-only"

import { LEAD_NICHE_KEYS, LEAD_NICHE_LABELS, type LeadNicheKey } from "@/lib/store/catalog"
import { anonymizedLead, type PublicLeadSample } from "@/lib/surfaces/anonymize"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

export type NicheOffer = {
  key: LeadNicheKey
  label: string
  count: number | null
  priceCents: number | null
  packSize: number | null
  samples: PublicLeadSample[]
}

function isNiche(value: string): value is LeadNicheKey {
  return (LEAD_NICHE_KEYS as readonly string[]).includes(value)
}

export function nicheKey(value: string) {
  const key = value.trim().toLowerCase()
  return isNiche(key) ? key : null
}

async function countAndSample(key: string) {
  const supabase = (await createSupabaseServer()) || createSupabaseAdmin()
  if (!supabase) return { count: null as number | null, samples: [] as PublicLeadSample[] }
  const listed = await supabase
    .from("lead_records")
    .select("region, company_size, score")
    .eq("niche", key)
    .eq("premium", true)
    .eq("sellable", true)
    .eq("consent_share", true)
    .eq("consent_contact", true)
    .eq("opted_out", false)
    .eq("suppressed", false)
    .limit(5)
  if (listed.error) return { count: null, samples: [] }
  const samples = (listed.data ?? []).map((row) => anonymizedLead(row as Record<string, unknown>))
  const counted = await supabase
    .from("lead_records")
    .select("id", { count: "exact", head: true })
    .eq("niche", key)
    .eq("premium", true)
    .eq("sellable", true)
    .eq("consent_share", true)
    .eq("consent_contact", true)
    .eq("opted_out", false)
    .eq("suppressed", false)
  return { count: counted.error ? samples.length : counted.count ?? samples.length, samples }
}

async function prices() {
  const admin = createSupabaseAdmin()
  if (!admin) return new Map<string, { priceCents: number; packSize: number }>()
  const { data, error } = await admin.from("lead_niche_prices").select("niche_key, price_cents, pack_size")
  if (error || !data) return new Map()
  return new Map(
    data.map((row) => [
      String((row as { niche_key?: string }).niche_key),
      {
        priceCents: Number((row as { price_cents?: number }).price_cents) || 0,
        packSize: Number((row as { pack_size?: number }).pack_size) || 0,
      },
    ]),
  )
}

export async function nicheOffers() {
  const priceMap = await prices()
  const offers: NicheOffer[] = []
  for (const key of LEAD_NICHE_KEYS) {
    const stock = await countAndSample(key)
    const price = priceMap.get(key)
    offers.push({
      key,
      label: LEAD_NICHE_LABELS[key],
      count: stock.count,
      priceCents: price ? price.priceCents : null,
      packSize: price ? price.packSize : null,
      samples: stock.samples,
    })
  }
  return offers
}

export async function nicheOffer(key: string) {
  const niche = nicheKey(key)
  if (!niche) return null
  const offers = await nicheOffers()
  return offers.find((offer) => offer.key === niche) ?? null
}
