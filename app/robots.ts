import type { MetadataRoute } from "next"
import { site } from "@/lib/site"

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

export default function robots(): MetadataRoute.Robots {
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
