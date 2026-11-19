import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { agencyPages } from "@/lib/agency-pages"
import { caseStudies, posts, services, site } from "@/lib/site"
import { bareHost, isStoreHost, STORE_ORIGIN } from "@/lib/store/hosts"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  if (isStoreHost(host)) {
    return [{ url: `${STORE_ORIGIN}/`, lastModified: new Date("2026-11-19T00:00:00Z"), changeFrequency: "weekly", priority: 1 }]
  }
  const lastModified = new Date("2026-11-18T00:00:00Z")
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
    "/store",
    "/start",
    "/privacy",
    "/terms",
  ]

  return [
    ...staticPaths.map((path) => ({
      url: `${site.url}${path || "/"}`,
      lastModified,
      changeFrequency: path === "" || path === "/blog" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/agency" || path === "/services" ? 0.9 : 0.7,
    })),
    ...agencyPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...services.map((service) => ({
      url: `${site.url}/services/${service.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...caseStudies.map((study) => ({
      url: `${site.url}/work/${study.slug}`,
      lastModified,
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
