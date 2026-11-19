import type { MetadataRoute } from "next"

/** The owner office is private. Do not index avaskye.online. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  }
}
