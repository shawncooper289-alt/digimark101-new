import { connectorAuthorized } from "@/lib/ava/team/connector"
import { site, services } from "@/lib/site"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!connectorAuthorized(request.headers.get("authorization"), process.env.MUSE_CONNECTOR_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  return Response.json({
    name: site.name,
    url: site.url,
    description: site.description,
    tagline: site.tagline,
    voice: "Plain American English. Warm and direct. Do not invent numbers, reviews, or client results. Ava is the only name a client hears, and it is pronounced AY-vuh.",
    services: services.map((service) => ({ name: service.name, summary: service.summary })),
  })
}
