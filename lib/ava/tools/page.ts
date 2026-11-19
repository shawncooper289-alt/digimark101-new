export type PageRecord = { type: string; id: string; label: string }

export type PageContext = {
  path: string
  module: string
  title?: string
  visible?: PageRecord[]
}

const modules: [string, string][] = [
  ["/studio/contacts", "contacts"],
  ["/studio/pipeline", "pipeline"],
  ["/studio/calendar", "calendar"],
  ["/studio/inbox", "inbox"],
  ["/studio/campaigns", "campaigns"],
  ["/studio/social", "social"],
  ["/studio/video", "video"],
  ["/studio/sites", "funnels"],
  ["/studio/forms", "forms"],
  ["/studio/automations", "workflows"],
  ["/studio/reputation", "reputation"],
  ["/studio/invoices", "invoices"],
  ["/studio/products", "products"],
  ["/studio/offers", "offers"],
  ["/studio/reports", "reports"],
  ["/studio/leads", "leads"],
  ["/studio/files", "files"],
  ["/studio/media", "media"],
  ["/studio/builds", "builds"],
  ["/studio/business", "business"],
  ["/studio/memory", "memory"],
  ["/studio/knowledge", "knowledge"],
  ["/studio/backend", "backend"],
  ["/studio/setup", "setup"],
  ["/studio", "today"],
  ["/pricing", "pricing"],
  ["/contact", "contact"],
  ["/ava", "ava"],
]

export function moduleFromPath(path: string) {
  const clean = path.split("?")[0] || "/"
  const match = modules.find(([prefix]) => clean === prefix || (prefix !== "/studio" && clean.startsWith(`${prefix}/`)))
  return match?.[1] ?? "page"
}

export function parsePageContext(value: unknown): PageContext | null {
  if (!value || typeof value !== "object") return null
  const record = value as { path?: unknown; module?: unknown; title?: unknown; visible?: unknown }
  const path = typeof record.path === "string" ? record.path.slice(0, 200) : ""
  if (!path.startsWith("/")) return null
  const visible = Array.isArray(record.visible)
    ? record.visible.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== "object") return []
        const row = item as { type?: unknown; id?: unknown; label?: unknown }
        const label = typeof row.label === "string" ? row.label.trim().slice(0, 160) : ""
        if (!label) return []
        return [{ type: typeof row.type === "string" ? row.type.slice(0, 40) : "record", id: typeof row.id === "string" ? row.id.slice(0, 80) : "", label }]
      })
    : []
  return {
    path,
    module: typeof record.module === "string" && record.module.trim() ? record.module.trim().slice(0, 40) : moduleFromPath(path),
    title: typeof record.title === "string" ? record.title.slice(0, 160) : undefined,
    visible,
  }
}

export function answerFromPage(question: string, page: PageContext | null) {
  if (!page) return null
  const asked = question.toLowerCase()
  if (!/what(?:'s| is) on (?:this |the )?(?:page|screen)|what am i looking at|what(?:'s| is) here|what can i do here/.test(asked)) return null
  const lines = (page.visible ?? []).slice(0, 12).map((item) => item.label)
  const list = lines.length ? lines.join(", ") : "nothing listed yet"
  const title = page.title || page.module
  return `You are on ${title} (${page.path}). On screen: ${list}. I can use the ${page.module} tools for this workspace. Sending, deleting, and charging still wait for a confirmation, and a payment request does not charge a card.`
}
