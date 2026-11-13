import { drainSpecialistQueue } from "@/lib/ava/specialist-run"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  const header = request.headers.get("authorization")
  if (!secret || header !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }
  const result = await drainSpecialistQueue()
  return Response.json(result)
}
