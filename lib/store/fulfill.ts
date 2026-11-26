import "server-only"

import { readFile } from "node:fs/promises"
import path from "node:path"
import { productBySku, type StoreProduct } from "@/lib/store/catalog"
import { leadIsDeliverable, leadsToCsv, type LeadCsvRow, type LeadFlags } from "@/lib/store/leads"
import { capturePaypalCheckout, createPaypalCheckout } from "@/lib/store/paypal"
import { readCapture } from "@/lib/store/paypal-parse"
import { confirmationPath, signDelivery } from "@/lib/store/token"
import { createSupabaseAdmin } from "@/lib/supabase/admin"

type Admin = NonNullable<ReturnType<typeof createSupabaseAdmin>>

export type StoreOrder = {
  id: string
  sku: string
  title: string
  amount_cents: number
  currency: string
  status: string
  buyer_id: string | null
  buyer_email: string
  workspace_id: string | null
  paypal_order_id: string | null
  paypal_capture_id: string | null
}

function missingTable(message: string) {
  return /does not exist|schema cache|Could not find the/i.test(message)
}

export function deliverySecret() {
  return process.env.STORE_DOWNLOAD_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ""
}

function asOrder(row: Record<string, unknown> | null): StoreOrder | null {
  if (!row || typeof row.id !== "string") return null
  return {
    id: row.id,
    sku: String(row.sku || ""),
    title: String(row.title || ""),
    amount_cents: Number(row.amount_cents) || 0,
    currency: String(row.currency || "USD"),
    status: String(row.status || ""),
    buyer_id: typeof row.buyer_id === "string" ? row.buyer_id : null,
    buyer_email: String(row.buyer_email || ""),
    workspace_id: typeof row.workspace_id === "string" ? row.workspace_id : null,
    paypal_order_id: typeof row.paypal_order_id === "string" ? row.paypal_order_id : null,
    paypal_capture_id: typeof row.paypal_capture_id === "string" ? row.paypal_capture_id : null,
  }
}

async function findOrder(admin: Admin, lookup: { id?: string | null; paypalOrderId?: string | null }) {
  if (lookup.id) {
    const { data, error } = await admin.from("store_orders").select("*").eq("id", lookup.id).maybeSingle()
    if (error) {
      if (missingTable(error.message)) return { order: null, missing: true }
      throw new Error("order lookup failed")
    }
    return { order: asOrder(data as Record<string, unknown> | null), missing: false }
  }
  if (lookup.paypalOrderId) {
    const { data, error } = await admin.from("store_orders").select("*").eq("paypal_order_id", lookup.paypalOrderId).maybeSingle()
    if (error) {
      if (missingTable(error.message)) return { order: null, missing: true }
      throw new Error("order lookup failed")
    }
    return { order: asOrder(data as Record<string, unknown> | null), missing: false }
  }
  return { order: null, missing: false }
}

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

async function consentByLead(admin: Admin, ids: string[]) {
  const map = new Map<string, boolean | null>()
  if (!ids.length) return map
  const { data, error } = await admin.from("lead_consent").select("lead_id, consent_share").in("lead_id", ids)
  if (error) {
    if (missingTable(error.message)) return map
    throw new Error("consent lookup failed")
  }
  for (const row of data ?? []) {
    const id = String((row as { lead_id?: string }).lead_id || "")
    if (!id) continue
    const share = (row as { consent_share?: boolean }).consent_share === true
    const previous = map.get(id)
    map.set(id, previous === false ? false : share)
  }
  return map
}

async function loadLeadRows(admin: Admin, niche: string) {
  const { data, error } = await admin
    .from("lead_records")
    .select("id, region, company_size, score, premium, sellable, consent_contact, consent_share, opted_out, suppressed")
    .eq("niche", niche)
    .eq("premium", true)
    .eq("sellable", true)
    .eq("consent_share", true)
    .eq("consent_contact", true)
    .eq("opted_out", false)
    .eq("suppressed", false)
    .limit(500)
  if (error) {
    if (missingTable(error.message)) return null
    throw new Error("lead lookup failed")
  }
  const rows = (data ?? []) as Record<string, unknown>[]
  const consent = await consentByLead(admin, rows.map((row) => String(row.id)))
  return rows.filter((row) => leadIsDeliverable(flagsOf(row, consent.get(String(row.id)) ?? null)))
}

export async function countDeliverableLeads(niche: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const rows = await loadLeadRows(admin, niche)
  if (!rows) return null
  const ids = rows.map((row) => String(row.id))
  if (!ids.length) return 0
  const { data, error } = await admin.from("store_lead_deliveries").select("lead_id").in("lead_id", ids)
  if (error) {
    if (missingTable(error.message)) return null
    throw new Error("delivery lookup failed")
  }
  const taken = new Set((data ?? []).map((row) => String((row as { lead_id?: string }).lead_id)))
  return ids.filter((id) => !taken.has(id)).length
}

async function reserveLeads(admin: Admin, order: StoreOrder, product: StoreProduct) {
  const niche = product.nicheKey
  const pack = product.packSize || 0
  if (!niche || pack < 1) return
  const existing = await admin.from("store_lead_deliveries").select("lead_id").eq("order_id", order.id)
  if (existing.error) throw new Error(existing.error.message)
  if ((existing.data ?? []).length > 0) return
  const rows = await loadLeadRows(admin, niche)
  if (!rows) throw new Error("lead store missing")
  const ids = rows.map((row) => String(row.id))
  const takenQuery = ids.length
    ? await admin.from("store_lead_deliveries").select("lead_id").in("lead_id", ids)
    : { data: [], error: null }
  if (takenQuery.error) throw new Error(takenQuery.error.message)
  const taken = new Set((takenQuery.data ?? []).map((row) => String((row as { lead_id?: string }).lead_id)))
  const chosen = ids.filter((id) => !taken.has(id)).slice(0, pack)
  for (const leadId of chosen) {
    const { error } = await admin.from("store_lead_deliveries").insert({ lead_id: leadId, order_id: order.id })
    if (error && !/duplicate key|unique/i.test(error.message)) throw new Error("lead reserve failed")
  }
}

async function workspaceFor(admin: Admin, userId: string) {
  const found = await admin.from("workspaces").select("id").eq("owner_id", userId).eq("personal", true).maybeSingle()
  if (found.data && typeof (found.data as { id?: string }).id === "string") return (found.data as { id: string }).id
  const created = await admin.from("workspaces").insert({ owner_id: userId, name: "Personal", personal: true }).select("id").maybeSingle()
  if (created.data && typeof (created.data as { id?: string }).id === "string") return (created.data as { id: string }).id
  const again = await admin.from("workspaces").select("id").eq("owner_id", userId).eq("personal", true).maybeSingle()
  return typeof (again.data as { id?: string } | null)?.id === "string" ? (again.data as { id: string }).id : null
}

async function grantCredits(admin: Admin, order: StoreOrder, product: StoreProduct) {
  const credits = product.credits || 0
  const userId = order.buyer_id
  if (!userId || credits <= 0) return
  const workspaceId = order.workspace_id || (await workspaceFor(admin, userId))
  const { error } = await admin.from("credit_ledger").insert({
    owner_id: userId,
    workspace_id: workspaceId,
    order_id: order.id,
    delta: credits,
    reason: product.sku,
  })
  if (error && !/duplicate key|unique/i.test(error.message)) throw new Error(error.message)
  if (workspaceId && workspaceId !== order.workspace_id) {
    await admin.from("store_orders").update({ workspace_id: workspaceId }).eq("id", order.id)
  }
}

async function notify(admin: Admin, order: StoreOrder) {
  const detail = `${order.title} · ${(order.amount_cents / 100).toFixed(2)} ${order.currency} · ${order.buyer_email || "no email"}`
  const rows = [
    { order_id: order.id, kind: "buyer", channel: "page", status: "sent", detail: "Confirmation page and download link." },
    { order_id: order.id, kind: "owner", channel: "page", status: "sent", detail },
  ]
  const { error } = await admin.from("store_order_notices").upsert(rows, { onConflict: "order_id,kind" })
  if (error && !missingTable(error.message)) throw new Error(error.message)
}

async function deliver(admin: Admin, order: StoreOrder) {
  const product = productBySku(order.sku)
  if (!product || order.status !== "paid") return
  if (product.kind === "leads") await reserveLeads(admin, order, product)
  if (product.kind === "credits") await grantCredits(admin, order, product)
  await notify(admin, order)
}

export async function createStoreCheckout(sku: string, buyerId: string | null) {
  const product = productBySku(sku)
  if (!product) return { ok: false as const, status: 400, error: "Unknown product." }
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, status: 503, error: "Checkout needs the Supabase service role." }
  if (product.kind === "leads" && product.nicheKey) {
    const stock = await countDeliverableLeads(product.nicheKey).catch(() => null)
    if (stock === null) {
      return { ok: false as const, status: 503, error: "Apply supabase/migrations/20261120_store_orders.sql before selling the lead list." }
    }
    if (stock < 1) return { ok: false as const, status: 409, error: "That list has no consented leads left." }
  }
  const inserted = await admin
    .from("store_orders")
    .insert({
      sku: product.sku,
      title: product.name,
      amount_cents: product.priceCents,
      currency: "USD",
      status: "pending",
      buyer_id: buyerId,
      buyer_email: "",
      delivery: product.kind,
    })
    .select("id")
    .single()
  if (inserted.error || !inserted.data?.id) {
    const message = inserted.error?.message || ""
    if (missingTable(message)) {
      return { ok: false as const, status: 503, error: "Apply supabase/migrations/20261120_store_orders.sql before taking payment." }
    }
    return { ok: false as const, status: 502, error: "Could not start checkout." }
  }
  const orderId = String(inserted.data.id)
  const paypal = await createPaypalCheckout({ orderId, amountCents: product.priceCents, title: product.name })
  if (!paypal.ok) {
    await admin.from("store_orders").update({ status: "failed" }).eq("id", orderId).eq("status", "pending")
    const error = paypal.reason === "unconfigured" ? "PayPal checkout is not configured on this server." : "PayPal did not open checkout."
    return { ok: false as const, status: paypal.reason === "unconfigured" ? 503 : 502, error }
  }
  const saved = await admin.from("store_orders").update({ paypal_order_id: paypal.id }).eq("id", orderId).select("id").single()
  if (saved.error) return { ok: false as const, status: 502, error: "Could not save the PayPal order." }
  return { ok: true as const, paypalOrderId: paypal.id }
}

async function markPaid(admin: Admin, order: StoreOrder, capture: { captureId: string; amountCents: number; currency: string; email: string }) {
  if (capture.currency !== "USD" || capture.amountCents !== order.amount_cents) {
    await admin.from("store_orders").update({ status: "failed" }).eq("id", order.id).eq("status", "pending")
    return { ok: false as const, reason: "amount" as const }
  }
  const patch: Record<string, string> = {
    status: "paid",
    paypal_capture_id: capture.captureId,
    paid_at: new Date().toISOString(),
  }
  if (capture.email) patch.buyer_email = capture.email
  const updated = await admin.from("store_orders").update(patch).eq("id", order.id).eq("status", "pending").select("*").maybeSingle()
  if (updated.error) throw new Error(updated.error.message)
  const paid = asOrder(updated.data as Record<string, unknown> | null)
  if (paid) {
    await deliver(admin, paid)
    return { ok: true as const, order: paid }
  }
  const current = await findOrder(admin, { id: order.id })
  if (current.order?.status === "paid") {
    await deliver(admin, current.order)
    return { ok: true as const, order: current.order }
  }
  return { ok: false as const, reason: "conflict" as const }
}

export async function captureStoreCheckout(paypalOrderId: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return { ok: false as const, status: 503, error: "Checkout needs the Supabase service role." }
  const found = await findOrder(admin, { paypalOrderId })
  if (found.missing) return { ok: false as const, status: 503, error: "Apply supabase/migrations/20261120_store_orders.sql before taking payment." }
  if (!found.order) return { ok: false as const, status: 404, error: "That checkout was not found." }
  if (found.order.status === "paid") {
    const secret = deliverySecret()
    return { ok: true as const, confirmationPath: secret ? confirmationPath(found.order.id, secret) : "/store/confirmation" }
  }
  const captured = await capturePaypalCheckout(paypalOrderId)
  if (!captured.ok) return { ok: false as const, status: 502, error: "PayPal did not complete the payment." }
  const parsed = readCapture(captured.json)
  if (!parsed || parsed.status !== "COMPLETED") return { ok: false as const, status: 502, error: "PayPal did not complete the payment." }
  if (parsed.customId && parsed.customId !== found.order.id) return { ok: false as const, status: 409, error: "This payment does not match the order." }
  const result = await markPaid(admin, found.order, parsed)
  if (!result.ok) return { ok: false as const, status: 409, error: "The payment amount did not match the price." }
  const secret = deliverySecret()
  return { ok: true as const, confirmationPath: secret ? confirmationPath(result.order.id, secret) : `/store/confirmation?order=${result.order.id}` }
}

export async function fulfillCapturedPayment(resource: unknown) {
  const parsed = readCapture(resource)
  if (!parsed || parsed.status !== "COMPLETED") return { ok: true as const, ignored: true }
  const admin = createSupabaseAdmin()
  if (!admin) throw new Error("Supabase service role is not configured")
  const found = parsed.customId
    ? await findOrder(admin, { id: parsed.customId })
    : await findOrder(admin, { paypalOrderId: parsed.paypalOrderId })
  if (found.missing) throw new Error("store orders table missing")
  if (!found.order) return { ok: true as const, ignored: true }
  if (parsed.paypalOrderId && found.order.paypal_order_id && parsed.paypalOrderId !== found.order.paypal_order_id) {
    return { ok: true as const, ignored: true }
  }
  const result = await markPaid(admin, found.order, parsed)
  if (!result.ok && result.reason === "amount") return { ok: true as const, ignored: false }
  if (!result.ok) throw new Error("store fulfill failed")
  return { ok: true as const, ignored: false }
}

export async function applyStoreCredits(user: { id: string; email?: string | null }) {
  const admin = createSupabaseAdmin()
  if (!admin || !user.id) return
  const email = user.email?.trim().toLowerCase() || ""
  const { data, error } = await admin.from("store_orders").select("*").eq("status", "paid").order("paid_at", { ascending: false }).limit(40)
  if (error || !data) return
  for (const row of data as Record<string, unknown>[]) {
    const order = asOrder(row)
    if (!order) continue
    const product = productBySku(order.sku)
    if (!product || product.kind !== "credits") continue
    const emailMatch = email && order.buyer_email.toLowerCase() === email
    if (order.buyer_id !== user.id && !emailMatch) continue
    if (!order.buyer_id) {
      await admin.from("store_orders").update({ buyer_id: user.id }).eq("id", order.id)
      order.buyer_id = user.id
    }
    await grantCredits(admin, order, product)
  }
}

export async function orderForReceipt(
  orderId: string,
  access: { sigOk: boolean; viewer: { id: string; email?: string | null; owner: boolean } | null },
) {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const found = await findOrder(admin, { id: orderId })
  const order = found.order
  if (!order || order.status !== "paid") return null
  if (access.sigOk) return order
  const viewer = access.viewer
  if (!viewer) return null
  if (viewer.owner || viewer.id === order.buyer_id) return order
  const email = viewer.email?.trim().toLowerCase() || ""
  if (email && email === order.buyer_email.toLowerCase()) return order
  return null
}

export async function readPromptFile(fileName: string) {
  if (!/^[a-z0-9.-]+$/.test(fileName)) return null
  const root = path.resolve(process.cwd(), "content", "store")
  const full = path.resolve(root, fileName)
  const relative = path.relative(root, full)
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null
  return readFile(full, "utf8")
}

export async function leadCsvForOrder(orderId: string) {
  const admin = createSupabaseAdmin()
  if (!admin) return null
  const { data: links, error } = await admin.from("store_lead_deliveries").select("lead_id").eq("order_id", orderId)
  if (error || !links?.length) return leadsToCsv([])
  const ids = links.map((row) => String((row as { lead_id?: string }).lead_id))
  const { data: leads, error: leadError } = await admin
    .from("lead_records")
    .select("id, region, company_size, score, premium, sellable, consent_contact, consent_share, opted_out, suppressed")
    .in("id", ids)
  if (leadError || !leads) return null
  const consent = await consentByLead(admin, ids)
  const allowed = (leads as Record<string, unknown>[]).filter((row) => leadIsDeliverable(flagsOf(row, consent.get(String(row.id)) ?? null)))
  const allowedIds = allowed.map((row) => String(row.id))
  const { data: people, error: peopleError } = allowedIds.length
    ? await admin.from("lead_private_contacts").select("lead_id, full_name, email, phone, company").in("lead_id", allowedIds)
    : { data: [], error: null }
  if (peopleError) return null
  const byLead = new Map((people ?? []).map((row) => [String((row as { lead_id?: string }).lead_id), row as Record<string, unknown>]))
  const csvRows: LeadCsvRow[] = allowed.map((row) => {
    const person = byLead.get(String(row.id))
    return {
      name: String(person?.full_name || ""),
      email: String(person?.email || ""),
      phone: String(person?.phone || ""),
      company: String(person?.company || ""),
      region: String(row.region || ""),
      companySize: String(row.company_size || ""),
      score: String(row.score ?? ""),
    }
  })
  return leadsToCsv(csvRows.filter((row) => row.email))
}

export async function listStoreOrders() {
  const admin = createSupabaseAdmin()
  if (!admin) return { ready: false as const, orders: [] as StoreOrder[] }
  const { data, error } = await admin.from("store_orders").select("*").order("created_at", { ascending: false }).limit(50)
  if (error) return { ready: false as const, orders: [] as StoreOrder[] }
  return { ready: true as const, orders: (data ?? []).map((row) => asOrder(row as Record<string, unknown>)).filter((row): row is StoreOrder => Boolean(row)) }
}

export function receiptPathFor(orderId: string) {
  const secret = deliverySecret()
  if (!secret) return ""
  return confirmationPath(orderId, secret)
}

export function downloadPathFor(orderId: string) {
  const secret = deliverySecret()
  if (!secret) return ""
  const exp = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60
  const sig = signDelivery(orderId, exp, secret)
  return `/api/store/download?order=${orderId}&exp=${exp}&sig=${encodeURIComponent(sig)}`
}
