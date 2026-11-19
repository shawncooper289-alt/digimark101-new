import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { site } from "@/lib/site"
import { bareHost, isStoreHost, STORE_ORIGIN } from "@/lib/store/hosts"

export const dynamic = "force-dynamic"

const privatePaths = [
  "/api/",
  "/studio",
  "/login",
  "/signup",
  "/account",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/owner",
  "/thank-you",
  "/cancel",
  "/unsubscribe",
  "/start/preview",
  "/store/confirmation",
]

const namedBots = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
]

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = bareHost((await headers()).get("x-forwarded-host") || (await headers()).get("host"))
  if (isStoreHost(host)) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/store/confirmation", "/auth/"] }],
      sitemap: `${STORE_ORIGIN}/sitemap.xml`,
      host: STORE_ORIGIN,
    }
  }
  return {
    rules: [
      ...namedBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: privatePaths,
      })),
      { userAgent: "*", allow: "/", disallow: privatePaths },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  }
}
