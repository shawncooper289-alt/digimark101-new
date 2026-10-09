import { session, failure } from '@/lib/platform/server'
import { capabilityStatus } from '@/lib/ava/skills'
export async function GET(req: Request) {
  try { await session(req); return Response.json(capabilityStatus(process.env), { headers: { 'Cache-Control': 'no-store' } }) }
  catch (error) { return failure(error) }
}
