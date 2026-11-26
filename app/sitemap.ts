import fs from "node:fs"
import path from "node:path"
import type { MetadataRoute } from "next"
import { agencyPages } from "@/lib/agency-pages"
import { pageLastModified } from "@/lib/seo/sitemap-dates"
import { caseStudies, posts, services, site } from "@/lib/site"

function mtime(file: string) {
  try {
    return fs.statSync(path.join(/* turbopackIgnore: true */ process.cwd(), file)).mtime
  } catch {
    return null
  }
}

function dated(urlPath: string, contentDate?: string | null): Date | undefined {
  return pageLastModified({ path: urlPath, contentDate, mtime })
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/agency",
    "/services",
    "/work",
    "/pricing",
    "/about",
    "/contact",
    "/blog",
    "/ava",
    "/beta",
    "/marketplace",
    "/start",
    "/privacy",
    "/terms",
  ]

  return [
    ...staticPaths.map((urlPath) => ({
      url: `${site.url}${urlPath || "/"}`,
      lastModified: dated(urlPath),
      changeFrequency: urlPath === "" || urlPath === "/blog" ? ("weekly" as const) : ("monthly" as const),
      priority: urlPath === "" ? 1 : urlPath === "/agency" || urlPath === "/services" ? 0.9 : 0.7,
    })),
    ...agencyPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: dated(page.path),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...services.map((service) => ({
      url: `${site.url}/services/${service.slug}`,
      lastModified: dated(`/services/${service.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...caseStudies.map((study) => ({
      url: `${site.url}/work/${study.slug}`,
      lastModified: dated(`/work/${study.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ]
}
