import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { ToolSpec } from "@/lib/ava/tools/registry"
import { LEAD_NICHE_KEYS } from "@/lib/store/catalog"
import { ToolFailure } from "@/lib/ava/tools/failure"

type ToolRow = { id: string; title: string; meta: string }

type Row = Record<string, unknown>

function clip(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function text(row: Row, key: string) {
  const value = row[key]
  return typeof value === "string" ? value : ""
}

function dollarsToCents(value: unknown) {
  const raw = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/[$,]/g, "")) : Number.NaN
  if (!Number.isFinite(raw) || raw < 0 || raw > 1_000_000) return null
  return Math.round(raw * 100)
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
}

function fail(error: { message: string }): never {
  if (/does not exist|schema cache|Could not find the|offer_kind|prompt_body|lead_niche_prices/i.test(error.message)) {
    throw new ToolFailure("Apply supabase/migrations/20261121_sales_surfaces.sql. Nothing was charged.", 503)
  }
  throw new ToolFailure("Could not update this workspace.", 502)
}

async function rowsOf(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? []) as Row[]
}

async function one(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) fail(error)
  return (data ?? null) as Row | null
}

export async function executeSurfaceTool(supabase: SupabaseClient, spec: ToolSpec, ownerId: string, args: Record<string, unknown>): Promise<{ summary: string; rows: ToolRow[] }> {
  switch (spec.name) {
    case "products.list": {
      const data = await rowsOf(supabase.from("products").select("id, name, amount_cents, kind, published, slug").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: `${text(row, "kind")} · ${row.published ? "published" : "draft"} · ${text(row, "slug")}` }))
      return { rows, summary: rows.length ? `${rows.length} products.` : "No products yet." }
    }
    case "products.create": {
      const name = clip(args.name, 120)
      const cents = dollarsToCents(args.amount)
      if (name.length < 2 || cents === null) throw new ToolFailure("A product needs a name and a price.")
      const kind = ["token", "prompt_pack", "one_time"].includes(clip(args.kind, 20)) ? clip(args.kind, 20) : "one_time"
      const slug = slugify(clip(args.slug, 60) || name)
      if (!slug) throw new ToolFailure("A product needs a slug.")
      const created = await one(supabase.from("products").insert({
        owner_id: ownerId,
        name,
        slug,
        kind,
        amount_cents: cents,
        description: clip(args.description, 1000),
        credits: kind === "token" ? Math.min(100000, Math.max(0, Math.round(Number(args.credits) || 0))) : 0,
        prompt_body: kind === "prompt_pack" ? clip(args.promptBody, 20000) : "",
        published: false,
        interval: "one_time",
        currency: "USD",
      }).select("id, name, slug").single())
      return { rows: [{ id: text(created ?? {}, "id"), title: name, meta: slug }], summary: `“${name}” is a draft. It is not on the store until you publish it.` }
    }
    case "products.update": {
      const id = clip(args.id, 80)
      const patch: Row = {}
      if (typeof args.name === "string") patch.name = clip(args.name, 120)
      if (typeof args.description === "string") patch.description = clip(args.description, 1000)
      if (typeof args.promptBody === "string") patch.prompt_body = clip(args.promptBody, 20000)
      const cents = dollarsToCents(args.amount)
      if (cents !== null) patch.amount_cents = cents
      const saved = await one(supabase.from("products").update(patch).eq("id", id).eq("owner_id", ownerId).select("id, name").single())
      if (!saved) throw new ToolFailure("That product is not in this workspace.", 404)
      return { rows: [{ id, title: text(saved, "name"), meta: "updated" }], summary: `Updated ${text(saved, "name")}.` }
    }
    case "products.delete": {
      const id = clip(args.id, 80)
      const { error } = await supabase.from("products").delete().eq("id", id).eq("owner_id", ownerId)
      if (error) fail(error)
      return { rows: [], summary: "The product was deleted. PayPal plans were not changed." }
    }
    case "products.publish": {
      const id = clip(args.id, 80)
      const published = clip(args.published, 10) !== "false"
      const saved = await one(supabase.from("products").update({ published }).eq("id", id).eq("owner_id", ownerId).select("id, name, slug, published").single())
      if (!saved) throw new ToolFailure("That product is not in this workspace.", 404)
      return { rows: [{ id, title: text(saved, "name"), meta: published ? "published" : "draft" }], summary: published ? `“${text(saved, "name")}” is on the store at /store/${text(saved, "slug")}.` : `“${text(saved, "name")}” is a draft again.` }
    }
    case "offers.list": {
      const data = await rowsOf(supabase.from("funnels").select("id, name, slug, status, offer_kind, surface").eq("owner_id", ownerId).eq("surface", "ink").order("created_at", { ascending: false }).limit(40))
      const rows = data.map((row) => ({ id: text(row, "id"), title: text(row, "name"), meta: `${text(row, "offer_kind")} · ${text(row, "status")} · ${text(row, "slug")}` }))
      return { rows, summary: rows.length ? `${rows.length} offers.` : "No offers for appdm101.ink yet." }
    }
    case "offers.create": {
      const name = clip(args.name, 120)
      if (name.length < 2) throw new ToolFailure("An offer needs a name.")
      const kind = ["upsell", "bump", "upgrade"].includes(clip(args.kind, 20)) ? clip(args.kind, 20) : "upsell"
      const slug = slugify(clip(args.slug, 80) || name)
      const cents = dollarsToCents(args.amount)
      const created = await one(supabase.from("funnels").insert({ owner_id: ownerId, name, slug, status: "draft", surface: "ink", offer_kind: kind }).select("id, name").single())
      const funnelId = text(created ?? {}, "id")
      if (funnelId) {
        const { error } = await supabase.from("funnel_pages").insert({
          funnel_id: funnelId,
          owner_id: ownerId,
          path: `/${slug}`,
          headline: clip(args.headline, 160) || name,
          body: clip(args.body, 4000),
          cta: clip(args.cta, 80) || "Continue",
          amount_cents: kind === "upgrade" ? null : cents,
          position: 0,
        })
        if (error) fail(error)
      }
      return { rows: [{ id: funnelId, title: name, meta: `${kind} · draft` }], summary: `Draft offer “${name}” is saved. It is not on appdm101.ink until you publish it.` }
    }
    case "offers.publish":
    case "offers.unpublish": {
      const id = clip(args.id, 80)
      const status = spec.name === "offers.publish" ? "published" : "draft"
      const saved = await one(supabase.from("funnels").update({ status }).eq("id", id).eq("owner_id", ownerId).eq("surface", "ink").select("id, name, slug, status").single())
      if (!saved) throw new ToolFailure("That offer is not in this workspace.", 404)
      const live = status === "published" ? `It is on /offers/${text(saved, "slug")}.` : "It is a draft again."
      return { rows: [{ id, title: text(saved, "name"), meta: status }], summary: `“${text(saved, "name")}” is ${status}. ${live}` }
    }
    case "leads.pricing_list": {
      const data = await rowsOf(supabase.from("lead_niche_prices").select("niche_key, price_cents, pack_size").order("niche_key"))
      const rows = data.map((row) => ({ id: text(row, "niche_key"), title: text(row, "niche_key"), meta: `${Number(row.price_cents) || 0} cents · pack ${row.pack_size}` }))
      return { rows, summary: rows.length ? `${rows.length} niche prices.` : "No niche prices yet. The marketplace will not sell a niche until you set one." }
    }
    case "leads.pricing_set": {
      const niche = clip(args.niche, 40)
      if (!(LEAD_NICHE_KEYS as readonly string[]).includes(niche)) throw new ToolFailure("Pick one of the existing lead niches.")
      const cents = dollarsToCents(args.amount)
      const pack = Math.round(Number(args.packSize) || 25)
      if (cents === null || pack < 1 || pack > 500) throw new ToolFailure("Set a price and a pack size from 1 to 500.")
      await one(supabase.from("lead_niche_prices").upsert({ niche_key: niche, price_cents: cents, pack_size: pack, currency: "USD", updated_at: new Date().toISOString() }).select("niche_key, price_cents, pack_size").single())
      return { rows: [{ id: niche, title: niche, meta: `${cents} cents` }], summary: `${niche} is ${(cents / 100).toFixed(2)} USD for up to ${pack} consented leads. PayPal plans were not changed.` }
    }
    default:
      throw new ToolFailure("That tool is not available.")
  }
}
