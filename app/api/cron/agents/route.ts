import { cronAuthorized } from "@/lib/cron/auth"
import { drainQueuedTeam } from "@/lib/ava/team/server-run"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 })
  const result = await drainQueuedTeam()
  return Response.json(result)
}
