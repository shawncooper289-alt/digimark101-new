import { createHash } from "node:crypto"
import { isOwnerIdentity, type OwnerIdentity } from "@/lib/owner/access"
import { createSupabaseAdmin } from "@/lib/supabase/admin"
import { createSupabaseServer } from "@/lib/supabase/server"

export type LeadSource = "form" | "csv" | "api" | "ava" | "connector"

export type LeadIntake = {
  email: string
  name?: string
  phone?: string
  company?: string
  website?: string
  message?: string
  service?: string
  region?: string
  companySize?: string
  source: LeadSource
  connectorId?: string
  consentContact: boolean
  consentShare: boolean
}

const NICHES: { key: string; words: string[] }[] = [
  { key: "seo", words: ["seo", "search", "ranking"] },
  { key: "paid-ads", words: ["ads", "ppc", "google ads", "meta ads", "paid"] },
  { key: "social", words: ["social", "instagram", "linkedin", "tiktok"] },
  { key: "content", words: ["content", "copy", "blog"] },
  { key: "web", words: ["web", "website", "landing"] },
  { key: "email", words: ["email", "newsletter"] },
  { key: "analytics", words: ["analytics", "tracking", "measurement"] },
  { key: "ai", words: ["ai", "automation", "ava"] },
]

const SIZES = new Set(["unspecified", "1-10", "11-50", "51-200", "201-1000", "1000+"])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONNECTOR_ID = /^[a-z0-9-]{1,40}$/
const TOKEN_ENV = /^[A-Z][A-Z0-9_]{0,60}$/

export function premiumMinScore() {
  const parsed = Number(process.env.LEAD_PREMIUM_MIN_SCORE ?? "70")
  if (!Number.isFinite(parsed)) return 70
  return Math.min(100, Math.max(0, Math.round(parsed)))
}

export function emailHash(email: string) {
  const salt = process.env.LEAD_HASH_SALT?.trim()
  if (!salt) return null
  return createHash("sha256").update(`${salt}:${email.trim().toLowerCase()}`).digest("hex")
}

export function classifyNiche(text: string) {
  const haystack = text.toLowerCase()
  let best = "general"
  let score = 0
  for (const niche of NICHES) {
    const hits = niche.words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0)
    if (hits > score) {
      score = hits
      best = niche.key
    }
  }
  return best
}

export function scoreLead(input: {
  consentContact: boolean
  consentShare: boolean
  hasCompany: boolean
  hasWebsite: boolean
  messageChars: number
  niche: string
}) {
  let score = 0
  if (input.consentContact) score += 20
  if (input.consentShare) score += 20
  if (input.hasCompany) score += 15
  if (input.hasWebsite) score += 15
  if (input.messageChars >= 40) score += 15
  if (input.niche !== "general") score += 15
  return Math.min(100, score)
}

function cleanSize(value: string | undefined) {
  const size = (value ?? "unspecified").trim()
  return SIZES.has(size) ? size : "unspecified"
}

function cleanRegion(value: string | undefined) {
  const region = (value ?? "").trim().slice(0, 40)
  return region || "unspecified"
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function flag(value: unknown) {
  if (typeof value === "boolean") return value
  return ["true", "yes", "1", "on"].includes(String(value ?? "").trim().toLowerCase())
}

export function leadsEngineReady() {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.LEAD_HASH_SALT?.trim() &&
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL),
  )
}

export function enrichmentConfigured() {
  return Boolean(process.env.ENRICHMENT_BASE_URL?.startsWith("https://") && process.env.ENRICHMENT_API_KEY?.trim())
}

type Admin = NonNullable<ReturnType<typeof createSupabaseAdmin>>

type Features = {
  niche: string
  region: string
  companySize: string
  consentContact: boolean
  consentShare: boolean
  hasCompany: boolean
  hasWebsite: boolean
  messageChars: number
  score: number
}

function featuresFrom(input: LeadIntake): Features {
  const message = (input.message ?? "").slice(0, 4000)
  const company = (input.company ?? "").trim().slice(0, 120)
  const website = (input.website ?? "").trim().slice(0, 200)
  const niche = classifyNiche(`${input.service ?? ""} ${message} ${company}`)
  const consentContact = input.consentContact
  const consentShare = input.consentShare && consentContact
  const shaped = {
    consentContact,
    consentShare,
    hasCompany: company.length > 1,
    hasWebsite: website.length > 3,
    messageChars: message.length,
    niche,
  }
  return {
    ...shaped,
    region: cleanRegion(input.region),
    companySize: cleanSize(input.companySize),
    score: scoreLead(shaped),
  }
}

async function isSuppressed(admin: Admin, hash: string) {
  const { data, error } = await admin.from("lead_suppressions").select("email_hash").eq("email_hash", hash).maybeSingle()
  if (error) throw new Error("suppression_lookup_failed")
  return Boolean(data)
}

async function rememberRejection(admin: Admin, hash: string, source: LeadSource, reason: "no_consent" | "suppressed" | "opted_out" | "deletion", niche = "general", score = 0) {
  await admin.from("lead_rejected").insert({
    email_hash: hash,
    niche,
    score,
    source_kind: source,
    reason,
  })
  await admin.from("lead_audit").insert({
    action: reason,
    email_hash: hash,
    detail: niche,
  })
}

export async function ingestLead(input: LeadIntake): Promise<{ stored: boolean; reason: "unconfigured" | "suppressed" | "no_consent" | "rejected" | "stored" }> {
  if (!input.consentContact) return { stored: false, reason: "no_consent" }
  if (!leadsEngineReady()) return { stored: false, reason: "unconfigured" }
  const admin = createSupabaseAdmin()
  const hash = emailHash(input.email)
  if (!admin || !hash || !EMAIL.test(input.email.trim())) return { stored: false, reason: "unconfigured" }
  if (await isSuppressed(admin, hash)) {
    await rememberRejection(admin, hash, input.source, "suppressed")
    return { stored: false, reason: "suppressed" }
  }

  const message = (input.message ?? "").slice(0, 4000)
  const company = (input.company ?? "").trim().slice(0, 120)
  const features = featuresFrom(input)
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await admin
    .from("lead_private_contacts")
    .select("id, staging_id, lead_id")
    .eq("email_hash", hash)
    .maybeSingle()
  if (existingError) return { stored: false, reason: "rejected" }

  if (existing?.lead_id) {
    if (features.consentShare) {
      await admin
        .from("lead_records")
        .update({ consent_share: true, sellable: true, updated_at: now })
        .eq("id", existing.lead_id)
        .eq("premium", true)
        .eq("opted_out", false)
        .eq("suppressed", false)
    }
    return { stored: true, reason: "stored" }
  }

  if (existing?.staging_id) {
    const { data: staged } = await admin
      .from("lead_staging")
      .select("consent_share, has_company, has_website, message_chars")
      .eq("id", existing.staging_id)
      .maybeSingle()
    await admin
      .from("lead_staging")
      .update({
        niche: features.niche,
        region: features.region,
        company_size: features.companySize,
        score: features.score,
        consent_contact: true,
        consent_share: Boolean(staged?.consent_share) || features.consentShare,
        has_company: Boolean(staged?.has_company) || features.hasCompany,
        has_website: Boolean(staged?.has_website) || features.hasWebsite,
        message_chars: Math.max(Number(staged?.message_chars) || 0, features.messageChars),
        updated_at: now,
      })
      .eq("id", existing.staging_id)
    if (message || company) {
      await admin
        .from("lead_private_contacts")
        .update({
          ...(company ? { company } : {}),
          ...(message ? { notes: message } : {}),
          full_name: (input.name ?? "").trim().slice(0, 80) || null,
          phone: (input.phone ?? "").trim().slice(0, 40) || null,
        })
        .eq("id", existing.id)
    }
    return { stored: true, reason: "stored" }
  }

  const { data: created, error: createError } = await admin
    .from("lead_staging")
    .insert({
      niche: features.niche,
      region: features.region,
      company_size: features.companySize,
      score: features.score,
      source_kind: input.source,
      connector_id: input.connectorId?.slice(0, 40) || null,
      consent_contact: true,
      consent_share: features.consentShare,
      consent_at: now,
      has_company: features.hasCompany,
      has_website: features.hasWebsite,
      message_chars: features.messageChars,
    })
    .select("id")
    .single()

  if (createError || !created?.id) return { stored: false, reason: "rejected" }

  const { error: privateError } = await admin.from("lead_private_contacts").insert({
    staging_id: created.id,
    email: input.email.trim().toLowerCase(),
    email_hash: hash,
    full_name: (input.name ?? "").trim().slice(0, 80) || null,
    phone: (input.phone ?? "").trim().slice(0, 40) || null,
    company: company || null,
    notes: message || null,
  })

  if (privateError) {
    await admin.from("lead_staging").delete().eq("id", created.id)
    if (privateError.code === "23505") return { stored: true, reason: "stored" }
    return { stored: false, reason: "rejected" }
  }

  return { stored: true, reason: "stored" }
}

export async function suppressEmail(email: string, reason: "opt_out" | "deletion") {
  if (!leadsEngineReady()) return { ok: false as const, reason: "unconfigured" as const }
  const admin = createSupabaseAdmin()
  const hash = emailHash(email)
  if (!admin || !hash) return { ok: false as const, reason: "unconfigured" as const }

  const { error: suppressError } = await admin.from("lead_suppressions").upsert({ email_hash: hash, reason })
  if (suppressError) return { ok: false as const, reason: "rejected" as const }

  const { data: matches, error: matchError } = await admin
    .from("lead_private_contacts")
    .select("id, lead_id, staging_id")
    .eq("email_hash", hash)
  if (matchError) return { ok: false as const, reason: "rejected" as const }

  for (const match of matches ?? []) {
    let niche = "general"
    let score = 0
    let source: LeadSource = "form"
    if (match.lead_id) {
      const { data: row } = await admin.from("lead_records").select("niche, score, source_kind").eq("id", match.lead_id).maybeSingle()
      niche = String(row?.niche || niche)
      score = Number(row?.score) || 0
      source = (row?.source_kind as LeadSource) || source
    } else if (match.staging_id) {
      const { data: row } = await admin.from("lead_staging").select("niche, score, source_kind").eq("id", match.staging_id).maybeSingle()
      niche = String(row?.niche || niche)
      score = Number(row?.score) || 0
      source = (row?.source_kind as LeadSource) || source
    }
    await rememberRejection(admin, hash, source, reason === "deletion" ? "deletion" : "opted_out", niche, score)
    await admin.from("lead_private_contacts").delete().eq("id", match.id)
    if (match.lead_id) await admin.from("lead_records").delete().eq("id", match.lead_id)
    if (match.staging_id) await admin.from("lead_staging").delete().eq("id", match.staging_id)
  }
  return { ok: true as const }
}

type Connector = { id: string; url: string; token: string }

function readConnectors() {
  const found: Connector[] = []
  const push = (id: string, url: string, token: string) => {
    const cleanId = id.trim().toLowerCase()
    const cleanUrl = url.trim()
    if (!CONNECTOR_ID.test(cleanId) || !cleanUrl.startsWith("https://") || !token.trim()) return
    if (found.some((item) => item.id === cleanId || item.url === cleanUrl)) return
    found.push({ id: cleanId, url: cleanUrl, token: token.trim() })
  }

  const raw = process.env.LEAD_CONNECTORS?.trim()
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || typeof item !== "object") continue
          const record = item as { id?: unknown; url?: unknown; tokenEnv?: unknown }
          const tokenEnv = typeof record.tokenEnv === "string" ? record.tokenEnv.trim() : ""
          const token = TOKEN_ENV.test(tokenEnv) ? process.env[tokenEnv]?.trim() || "" : ""
          push(typeof record.id === "string" ? record.id : "", typeof record.url === "string" ? record.url : "", token)
        }
      }
    } catch {
      // A bad connector list does not stop scoring of leads already staged.
    }
  }

  push("default", process.env.LEAD_CONNECTOR_URL || "", process.env.LEAD_CONNECTOR_TOKEN || "")
  return found.slice(0, 8)
}

async function pullConnectors() {
  const connectors = readConnectors()
  let pulled = 0
  let staged = 0
  let skipped = 0
  if (connectors.length === 0) return { connectors: 0, pulled, staged, skipped }

  for (const connector of connectors) {
    try {
      const response = await fetch(connector.url, {
        method: "GET",
        headers: { Authorization: `Bearer ${connector.token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
      })
      const contentType = response.headers.get("content-type") || ""
      if (!response.ok || response.status >= 300 || !contentType.includes("json")) {
        skipped += 1
        continue
      }
      const payload = (await response.json()) as { leads?: unknown }
      const leads = Array.isArray(payload.leads) ? payload.leads.slice(0, 100) : []
      for (const item of leads) {
        if (!item || typeof item !== "object") {
          skipped += 1
          continue
        }
        const row = item as Record<string, unknown>
        const email = text(row.email, 160)
        const consentContact = flag(row.consent_contact ?? row.consentContact)
        pulled += 1
        if (!EMAIL.test(email) || !consentContact) {
          const hash = EMAIL.test(email) ? emailHash(email) : null
          const admin = createSupabaseAdmin()
          if (hash && admin) await rememberRejection(admin, hash, "connector", "no_consent")
          skipped += 1
          continue
        }
        const result = await ingestLead({
          email,
          name: text(row.name ?? row.full_name, 80),
          phone: text(row.phone, 40),
          company: text(row.company, 120),
          website: text(row.website, 200),
          message: text(row.message ?? row.notes, 4000),
          service: text(row.niche ?? row.service, 40),
          region: text(row.region, 40),
          companySize: text(row.company_size ?? row.companySize, 20),
          source: "connector",
          connectorId: connector.id,
          consentContact: true,
          consentShare: flag(row.consent_share ?? row.consentShare),
        })
        if (result.stored) staged += 1
        else skipped += 1
      }
    } catch {
      skipped += 1
    }
  }
  return { connectors: connectors.length, pulled, staged, skipped }
}

async function qualifyStaging(admin: Admin) {
  const threshold = premiumMinScore()
  const { data: rows, error } = await admin.from("lead_staging").select("*").limit(500)
  if (error) return { promoted: 0, rejected: 0, stillStaging: 0, qualifyError: true as const }
  let promoted = 0
  let rejected = 0

  for (const row of rows ?? []) {
    const { data: contact } = await admin.from("lead_private_contacts").select("id, email_hash").eq("staging_id", row.id).maybeSingle()
    if (!contact?.email_hash || !contact.id) {
      await admin.from("lead_staging").delete().eq("id", row.id)
      continue
    }
    const hash = String(contact.email_hash)
    const source = (row.source_kind as LeadSource) || "form"
    if (await isSuppressed(admin, hash) || !row.consent_contact) {
      await rememberRejection(admin, hash, source, row.consent_contact ? "suppressed" : "no_consent", String(row.niche || "general"), Number(row.score) || 0)
      await admin.from("lead_private_contacts").delete().eq("id", contact.id)
      await admin.from("lead_staging").delete().eq("id", row.id)
      rejected += 1
      continue
    }

    const score = scoreLead({
      consentContact: true,
      consentShare: Boolean(row.consent_share),
      hasCompany: Boolean(row.has_company),
      hasWebsite: Boolean(row.has_website),
      messageChars: Number(row.message_chars) || 0,
      niche: String(row.niche || "general"),
    })
    const premium = score >= threshold
    if (!premium) {
      await admin.from("lead_staging").update({ score, updated_at: new Date().toISOString() }).eq("id", row.id)
      continue
    }

    const now = new Date().toISOString()
    const { data: created, error: createError } = await admin
      .from("lead_records")
      .insert({
        niche: row.niche,
        region: row.region,
        company_size: row.company_size,
        score,
        source_kind: row.source_kind,
        connector_id: row.connector_id,
        consent_contact: true,
        consent_share: Boolean(row.consent_share),
        consent_at: row.consent_at,
        has_company: Boolean(row.has_company),
        has_website: Boolean(row.has_website),
        message_chars: Number(row.message_chars) || 0,
        sellable: Boolean(row.consent_share),
        premium: true,
        opted_out: false,
        suppressed: false,
        enriched_at: row.enriched_at,
        updated_at: now,
      })
      .select("id")
      .single()
    if (createError || !created?.id) continue

    const { error: moveError } = await admin
      .from("lead_private_contacts")
      .update({ lead_id: created.id, staging_id: null })
      .eq("id", contact.id)
    if (moveError) {
      await admin.from("lead_records").delete().eq("id", created.id)
      continue
    }
    await admin.from("lead_staging").delete().eq("id", row.id)
    promoted += 1
  }

  return { promoted, rejected, stillStaging: Math.max(0, (rows ?? []).length - promoted - rejected), qualifyError: false as const }
}

async function rescoreStore(admin: Admin) {
  const threshold = premiumMinScore()
  const { data: rows, error } = await admin.from("lead_records").select("*").limit(500)
  if (error) return { premium: 0, demoted: 0 }
  let premium = 0
  let demoted = 0

  for (const row of rows ?? []) {
    const { data: contact } = await admin.from("lead_private_contacts").select("id, email_hash").eq("lead_id", row.id).maybeSingle()
    const hash = contact?.email_hash ? String(contact.email_hash) : ""
    const suppressed = hash ? await isSuppressed(admin, hash) : false
    const source = (row.source_kind as LeadSource) || "form"
    if (suppressed || row.opted_out || !row.consent_contact) {
      if (hash) {
        await rememberRejection(
          admin,
          hash,
          source,
          row.opted_out ? "opted_out" : suppressed ? "suppressed" : "no_consent",
          String(row.niche || "general"),
          Number(row.score) || 0,
        )
      }
      if (contact?.id) await admin.from("lead_private_contacts").delete().eq("id", contact.id)
      await admin.from("lead_records").delete().eq("id", row.id)
      demoted += 1
      continue
    }

    const score = scoreLead({
      consentContact: true,
      consentShare: Boolean(row.consent_share),
      hasCompany: Boolean(row.has_company),
      hasWebsite: Boolean(row.has_website),
      messageChars: Number(row.message_chars) || 0,
      niche: String(row.niche || "general"),
    })
    if (score < threshold) {
      const { data: staged, error: stageError } = await admin
        .from("lead_staging")
        .insert({
          niche: row.niche,
          region: row.region,
          company_size: row.company_size,
          score,
          source_kind: row.source_kind,
          connector_id: row.connector_id,
          consent_contact: true,
          consent_share: Boolean(row.consent_share),
          consent_at: row.consent_at,
          has_company: Boolean(row.has_company),
          has_website: Boolean(row.has_website),
          message_chars: Number(row.message_chars) || 0,
          enriched_at: row.enriched_at,
        })
        .select("id")
        .single()
      if (stageError || !staged?.id || !contact?.id) continue
      const { error: moveError } = await admin.from("lead_private_contacts").update({ staging_id: staged.id, lead_id: null }).eq("id", contact.id)
      if (moveError) {
        await admin.from("lead_staging").delete().eq("id", staged.id)
        continue
      }
      await admin.from("lead_records").delete().eq("id", row.id)
      demoted += 1
      continue
    }

    premium += 1
    await admin
      .from("lead_records")
      .update({
        score,
        premium: true,
        sellable: Boolean(row.consent_share),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
  }

  return { premium, demoted }
}

async function enrichBatch(admin: Admin) {
  if (!enrichmentConfigured()) return "unconfigured" as const
  const base = process.env.ENRICHMENT_BASE_URL!.replace(/\/$/, "")
  const key = process.env.ENRICHMENT_API_KEY!
  const { data: pending, error } = await admin.from("lead_staging").select("id").is("enriched_at", null).limit(25)
  if (error || !pending?.length) return "skipped" as const

  for (const row of pending) {
    const { data: contact } = await admin.from("lead_private_contacts").select("email").eq("staging_id", row.id).maybeSingle()
    const email = typeof contact?.email === "string" ? contact.email : ""
    if (!email) continue
    try {
      const response = await fetch(base, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
      })
      if (!response.ok || response.status >= 300) continue
      const payload = (await response.json()) as { region?: unknown; company_size?: unknown }
      const region = typeof payload.region === "string" ? cleanRegion(payload.region) : null
      const companySize = typeof payload.company_size === "string" ? cleanSize(payload.company_size) : null
      await admin
        .from("lead_staging")
        .update({
          ...(region ? { region } : {}),
          ...(companySize ? { company_size: companySize } : {}),
          enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
    } catch {
      // Provider errors stay on the server. The address is not logged.
    }
  }
  return "ran" as const
}

export async function runLeadJob() {
  if (!leadsEngineReady()) return { ok: false as const, reason: "unconfigured" as const }
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, reason: "unconfigured" as const }
  const pulled = await pullConnectors()
  const enriched = await enrichBatch(admin)
  const qualified = await qualifyStaging(admin)
  const rescored = await rescoreStore(admin)
  return {
    ok: true as const,
    ...pulled,
    enriched,
    promoted: qualified.promoted,
    rejected: qualified.rejected,
    stillStaging: qualified.stillStaging,
    premium: rescored.premium,
    demoted: rescored.demoted,
  }
}

export async function previewPools() {
  const supabase = await createSupabaseServer()
  if (!supabase) return []
  const store = await supabase.from("lead_store").select("niche, region, company_size, score").limit(500)
  const fallback = store.error
    ? await supabase.from("lead_records").select("niche, region, company_size, score").eq("premium", true).eq("sellable", true).limit(500)
    : store
  const data = fallback.data
  if (fallback.error || !data) return []
  const groups = new Map<string, { niche: string; count: number; regions: Set<string>; sizes: Set<string>; scores: number[] }>()
  for (const row of data) {
    const niche = String(row.niche || "general")
    const current = groups.get(niche) ?? { niche, count: 0, regions: new Set<string>(), sizes: new Set<string>(), scores: [] }
    current.count += 1
    if (row.region) current.regions.add(String(row.region))
    if (row.company_size) current.sizes.add(String(row.company_size))
    current.scores.push(Number(row.score) || 0)
    groups.set(niche, current)
  }
  return [...groups.values()].map((group) => ({
    niche: group.niche,
    count: group.count,
    regions: [...group.regions].slice(0, 6),
    sizes: [...group.sizes].slice(0, 6),
    scoreMin: Math.min(...group.scores),
    scoreMax: Math.max(...group.scores),
  }))
}

export async function ownerLeadCounts(user: OwnerIdentity | null) {
  if (!isOwnerIdentity(user)) return { allowed: false as const }
  const admin = createSupabaseAdmin()
  if (!admin) return { allowed: true as const, ready: false as const }
  const { data, error } = await admin.from("lead_records").select("niche, premium, sellable, consent_share").eq("premium", true)
  if (error) return { allowed: true as const, ready: false as const }
  const byNiche = new Map<string, { niche: string; premium: number; ownUse: number; sellable: number }>()
  for (const row of data ?? []) {
    const niche = String(row.niche || "general")
    const current = byNiche.get(niche) ?? { niche, premium: 0, ownUse: 0, sellable: 0 }
    current.premium += 1
    if (row.sellable) current.sellable += 1
    if (!row.consent_share) current.ownUse += 1
    byNiche.set(niche, current)
  }
  return {
    allowed: true as const,
    ready: true as const,
    threshold: premiumMinScore(),
    enrichment: enrichmentConfigured() ? ("configured" as const) : ("unconfigured" as const),
    connectors: readConnectors().length,
    niches: [...byNiche.values()],
  }
}

export async function createLeadOrder(buyerId: string, niche: string) {
  const admin = createSupabaseAdmin()
  if (!admin || !buyerId) return { ok: false as const, reason: "unconfigured" as const }
  const cleanNiche = niche.trim().slice(0, 40)
  if (!cleanNiche) return { ok: false as const, reason: "rejected" as const }
  const { data, error } = await admin.from("lead_orders").insert({ buyer_id: buyerId, niche: cleanNiche, status: "pending" }).select("id").single()
  if (error || !data?.id) return { ok: false as const, reason: "rejected" as const }
  return { ok: true as const, orderId: String(data.id), payment: "manual" as const }
}

export async function confirmLeadOrder(user: OwnerIdentity | null, orderId: string) {
  if (!isOwnerIdentity(user)) return { ok: false as const, reason: "forbidden" as const }
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, reason: "unconfigured" as const }
  const { data: order, error } = await admin.from("lead_orders").select("id, buyer_id, niche, status").eq("id", orderId).maybeSingle()
  if (error || !order || order.status === "cancelled") return { ok: false as const, reason: "rejected" as const }
  const { data: leads, error: leadError } = await admin
    .from("lead_records")
    .select("id")
    .eq("niche", order.niche)
    .eq("premium", true)
    .eq("sellable", true)
    .eq("opted_out", false)
    .eq("suppressed", false)
  if (leadError) return { ok: false as const, reason: "rejected" as const }
  const buyerId = String(order.buyer_id || "")
  if (!buyerId) return { ok: false as const, reason: "rejected" as const }
  if ((leads ?? []).length > 0) {
    const { error: releaseError } = await admin.from("lead_releases").upsert(
      (leads ?? []).map((lead) => ({ order_id: order.id, lead_id: lead.id, buyer_id: buyerId })),
      { onConflict: "order_id,lead_id" },
    )
    if (releaseError) return { ok: false as const, reason: "rejected" as const }
  }
  const { error: updateError } = await admin.from("lead_orders").update({ status: "paid" }).eq("id", order.id)
  if (updateError) return { ok: false as const, reason: "rejected" as const }
  return { ok: true as const, released: (leads ?? []).length }
}

export async function releaseLeadOrder(buyerId: string, orderId: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, reason: "unconfigured" as const }
  const { data: order, error } = await admin.from("lead_orders").select("id, buyer_id, status").eq("id", orderId).maybeSingle()
  if (error || !order || order.buyer_id !== buyerId) return { ok: false as const, reason: "forbidden" as const }
  if (order.status !== "paid") return { ok: false as const, reason: "unpaid" as const }
  const { data: releases, error: releaseError } = await admin.from("lead_releases").select("lead_id").eq("order_id", orderId).eq("buyer_id", buyerId)
  if (releaseError) return { ok: false as const, reason: "rejected" as const }
  const ids = (releases ?? []).map((row) => String(row.lead_id))
  if (ids.length === 0) return { ok: true as const, contacts: [] }
  const { data: contacts, error: contactError } = await admin.from("lead_private_contacts").select("full_name, email, phone, company").in("lead_id", ids)
  if (contactError) return { ok: false as const, reason: "rejected" as const }
  return {
    ok: true as const,
    contacts: (contacts ?? []).map((row) => ({
      name: row.full_name ? String(row.full_name) : "",
      email: String(row.email || ""),
      phone: row.phone ? String(row.phone) : "",
      company: row.company ? String(row.company) : "",
    })),
  }
}

export function intakeFromAva(message: string) {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
  if (!email) return Promise.resolve(null)
  const share = /you may share|consent to share|include me in a lead list|share my contact/i.test(message)
  const contact = share || /contact me|email me|you can email|reach me/i.test(message)
  if (!contact) return Promise.resolve(null)
  return ingestLead({
    email,
    message,
    source: "ava",
    consentContact: true,
    consentShare: share,
  })
}
