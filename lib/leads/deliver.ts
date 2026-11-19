import "server-only"

import { leadIsDeliverable, type LeadFlags } from "@/lib/store/leads"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

function flagsOf(row: Record<string, unknown>, consentRowShare: boolean | null): LeadFlags {
  return {
    premium: row.premium === true,
    sellable: row.sellable === true,
    consentContact: row.consent_contact === true,
    consentShare: row.consent_share === true,
    optedOut: row.opted_out === true,
    suppressed: row.suppressed === true,
    consentRowShare,
  }
}

export async function copyLeadsToWorkspace(input: { orderId: string; buyerId: string; niche: string; packSize: number }) {
  const admin = createSupabaseAdmin()
  if (!admin || !input.buyerId) return 0
  const existing = await admin.from("store_lead_deliveries").select("lead_id").eq("order_id", input.orderId)
  if (existing.error) throw new Error("lead delivery lookup failed")
  if ((existing.data ?? []).length > 0) return existing.data?.length ?? 0

  const listed = await admin
    .from("lead_records")
    .select("id, region, company_size, score, premium, sellable, consent_contact, consent_share, opted_out, suppressed")
    .eq("niche", input.niche)
    .eq("premium", true)
    .eq("sellable", true)
    .eq("consent_share", true)
    .eq("consent_contact", true)
    .eq("opted_out", false)
    .eq("suppressed", false)
    .limit(500)
  if (listed.error) throw new Error("lead lookup failed")
  const rows = (listed.data ?? []) as Record<string, unknown>[]
  const ids = rows.map((row) => String(row.id))
  const consent = new Map<string, boolean | null>()
  if (ids.length) {
    const consentRows = await admin.from("lead_consent").select("lead_id, consent_share").in("lead_id", ids)
    if (consentRows.error && !/does not exist|schema cache/i.test(consentRows.error.message)) throw new Error("consent lookup failed")
    for (const row of consentRows.data ?? []) {
      const id = String((row as { lead_id?: string }).lead_id || "")
      const share = (row as { consent_share?: boolean }).consent_share === true
      const previous = consent.get(id)
      if (id) consent.set(id, previous === false ? false : share)
    }
  }
  const allowed = rows.filter((row) => leadIsDeliverable(flagsOf(row, consent.get(String(row.id)) ?? null)))
  const taken = ids.length ? await admin.from("store_lead_deliveries").select("lead_id").in("lead_id", ids) : { data: [], error: null }
  if (taken.error) throw new Error("lead reserve lookup failed")
  const used = new Set((taken.data ?? []).map((row) => String((row as { lead_id?: string }).lead_id)))
  const chosen = allowed.map((row) => String(row.id)).filter((id) => !used.has(id)).slice(0, input.packSize)
  if (!chosen.length) return 0
  const people = await admin.from("lead_private_contacts").select("lead_id, full_name, email, phone, company").in("lead_id", chosen)
  if (people.error) throw new Error("contact lookup failed")
  const byLead = new Map((people.data ?? []).map((row) => [String((row as { lead_id?: string }).lead_id), row as Record<string, unknown>]))
  let copied = 0
  for (const leadId of chosen) {
    const reserved = await admin.from("store_lead_deliveries").insert({ lead_id: leadId, order_id: input.orderId })
    if (reserved.error) continue
    const person = byLead.get(leadId)
    if (!person) continue
    const saved = await admin.from("contacts").insert({
      owner_id: input.buyerId,
      name: String(person.full_name || "Lead"),
      email: String(person.email || ""),
      phone: String(person.phone || ""),
      company: String(person.company || ""),
      notes: `Purchased ${input.niche} lead. Personal details were released after payment.`,
    })
    if (!saved.error) copied += 1
  }
  return copied
}
