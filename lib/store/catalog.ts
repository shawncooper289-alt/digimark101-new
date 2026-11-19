/**
 * Fast-money store catalog. Edit prices and copy here.
 * These are one-time products. They do not create or change PayPal plans.
 * nicheKey must be one of LEAD_NICHE_KEYS (the rows in public.lead_niches).
 */

export const LEAD_NICHE_KEYS = ["general", "seo", "paid-ads", "social", "content", "web", "email", "analytics", "ai"] as const

export type LeadNicheKey = (typeof LEAD_NICHE_KEYS)[number]

export const LEAD_NICHE_LABELS: Record<LeadNicheKey, string> = {
  general: "General",
  seo: "SEO",
  "paid-ads": "Paid ads",
  social: "Social",
  content: "Content",
  web: "Web",
  email: "Email",
  analytics: "Analytics",
  ai: "AI",
}

export type StoreProduct = {
  sku: string
  name: string
  priceCents: number
  blurb: string
  includes: string[]
  kind: "download" | "credits" | "leads"
  file?: string
  credits?: number
  nicheKey?: LeadNicheKey
  packSize?: number
  preview?: string[]
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    sku: "ava-prompt-pack",
    name: "Ava prompt pack for marketers",
    priceCents: 2700,
    blurb: "A download of prompts you can paste into Ava for offers, emails, pages, and ads.",
    includes: ["15 prompts for offers, pages, email, and ads", "A short note on how to fill the blanks", "Markdown file on the confirmation page"],
    kind: "download",
    file: "ava-marketer-prompts.md",
    preview: [
      "Write a one-page offer for [business]. The buyer is [who]. The problem is [problem]. End with a single next step. Do not invent results or client names.",
      "Draft three short emails for people who asked about [offer]. Email one names the problem. Email two shows the work. Email three asks for the next step. No fake urgency.",
    ],
  },
  {
    sku: "ava-credit-bundle",
    name: "Ava credit bundle",
    priceCents: 2900,
    blurb: "1,000 Ava credits added to the workspace for the PayPal email you pay with.",
    includes: ["1,000 credits", "Applied when that email is signed in", "One-time. No renewal."],
    kind: "credits",
    credits: 1000,
  },
  {
    sku: "niche-lead-list",
    name: "Done-for-you niche lead list",
    priceCents: 7900,
    blurb: "A CSV of consented leads from one niche, delivered after payment. Personal details stay off this page.",
    includes: ["Up to 25 leads that allowed sharing", "Name, email, phone, and company when we have them", "People who opted out are left out"],
    kind: "leads",
    nicheKey: "seo",
    packSize: 25,
  },
]

export function formatStorePrice(cents: number) {
  const dollars = Math.trunc(cents / 100)
  const rest = Math.abs(cents) % 100
  if (rest === 0) return `$${dollars}`
  return `$${dollars}.${String(rest).padStart(2, "0")}`
}

export function productBySku(sku: string) {
  return STORE_PRODUCTS.find((product) => product.sku === sku) ?? null
}

export function catalogProblems() {
  const problems: string[] = []
  const skus = new Set<string>()
  for (const product of STORE_PRODUCTS) {
    if (!/^[a-z0-9-]{1,40}$/.test(product.sku)) problems.push(`sku ${product.sku}`)
    if (skus.has(product.sku)) problems.push(`duplicate ${product.sku}`)
    skus.add(product.sku)
    if (!Number.isInteger(product.priceCents) || product.priceCents <= 0) problems.push(`price ${product.sku}`)
    if (product.kind === "download" && !product.file) problems.push(`file ${product.sku}`)
    if (product.kind === "credits" && (!product.credits || product.credits <= 0)) problems.push(`credits ${product.sku}`)
    if (product.kind === "leads") {
      if (!product.nicheKey || !LEAD_NICHE_KEYS.includes(product.nicheKey)) problems.push(`niche ${product.sku}`)
      if (!product.packSize || product.packSize < 1 || product.packSize > 500) problems.push(`pack ${product.sku}`)
    }
  }
  if (STORE_PRODUCTS.length !== 3) problems.push("expected 3 products")
  return problems
}

export type PublicStoreProduct = {
  sku: string
  name: string
  priceCents: number
  priceLabel: string
  blurb: string
  includes: string[]
  kind: StoreProduct["kind"]
  credits: number | null
  nicheKey: LeadNicheKey | null
  nicheLabel: string | null
  packSize: number | null
  preview: string[]
}

export function toPublicProduct(product: StoreProduct): PublicStoreProduct {
  return {
    sku: product.sku,
    name: product.name,
    priceCents: product.priceCents,
    priceLabel: formatStorePrice(product.priceCents),
    blurb: product.blurb,
    includes: product.includes,
    kind: product.kind,
    credits: product.credits ?? null,
    nicheKey: product.nicheKey ?? null,
    nicheLabel: product.nicheKey ? LEAD_NICHE_LABELS[product.nicheKey] : null,
    packSize: product.packSize ?? null,
    preview: product.preview ?? [],
  }
}
