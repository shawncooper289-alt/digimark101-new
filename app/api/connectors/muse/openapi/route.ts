import { readFileSync } from "node:fs"
import path from "node:path"
import { connectorAuthorized } from "@/lib/ava/team/connector"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!connectorAuthorized(request.headers.get("authorization"), process.env.MUSE_CONNECTOR_KEY)) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const file = path.join(process.cwd(), "docs", "muse-connector.openapi.yaml")
  const body = readFileSync(file, "utf8")
  return new Response(body, { status: 200, headers: { "Content-Type": "application/yaml; charset=utf-8" } })
}
