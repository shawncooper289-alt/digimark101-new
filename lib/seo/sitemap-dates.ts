/** Source file whose mtime is the honest lastModified when a page has no content date. */
export const SITEMAP_FILES: Record<string, string> = {
  "": "app/(marketing)/page.tsx",
  "/agency": "app/(marketing)/agency/page.tsx",
  "/services": "app/(marketing)/services/page.tsx",
  "/work": "app/(marketing)/work/page.tsx",
  "/pricing": "app/(marketing)/pricing/page.tsx",
  "/about": "app/(marketing)/about/page.tsx",
  "/contact": "app/(marketing)/contact/page.tsx",
  "/blog": "app/(marketing)/blog/page.tsx",
  "/ava": "app/(marketing)/ava/page.tsx",
  "/beta": "app/(marketing)/beta/page.tsx",
  "/marketplace": "app/(marketing)/marketplace/page.tsx",
  "/start": "app/(marketing)/start/page.tsx",
  "/privacy": "app/(marketing)/privacy/page.tsx",
  "/terms": "app/(marketing)/terms/page.tsx",
}

export function sitemapFile(path: string) {
  const key = path === "/" ? "" : path
  if (SITEMAP_FILES[key]) return SITEMAP_FILES[key]
  if (path.startsWith("/agency/")) return "lib/agency-pages.ts"
  if (path.startsWith("/services/")) return "lib/site.ts"
  if (path.startsWith("/work/")) return "lib/site.ts"
  if (path.startsWith("/blog/")) return "lib/site.ts"
  return null
}

export function pageLastModified(input: {
  path: string
  contentDate?: string | null
  mtime: (file: string) => Date | null
}) {
  if (input.contentDate && /^\d{4}-\d{2}-\d{2}$/.test(input.contentDate)) {
    return new Date(`${input.contentDate}T00:00:00.000Z`)
  }
  const file = sitemapFile(input.path)
  if (!file) return undefined
  return input.mtime(file) ?? undefined
}
