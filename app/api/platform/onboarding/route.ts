import { session, failure } from '@/lib/platform/server'
const fields = ['business', 'website', 'offer', 'audience', 'goal', 'brandVoice', 'budget', 'compliance'] as const
export async function GET(req: Request) {
  try {
    const { db, user } = await session(req)
    const result = await db.from('ava_onboarding').select('brief,mode,updated_at').eq('user_id', user.id).maybeSingle()
    if (result.error) throw result.error
    return Response.json({ onboarding: result.data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return failure(error) }
}
export async function POST(req: Request) {
  try {
    const { db, user } = await session(req)
    let body
    try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }) }
    if (!body || typeof body !== 'object' || !['guided', 'self-directed'].includes(body.mode) || !body.brief || typeof body.brief !== 'object') return Response.json({ error: 'Invalid onboarding.' }, { status: 400 })
    const brief: Record<string, string> = {}
    for (const field of fields) {
      if (typeof body.brief[field] !== 'string' || body.brief[field].length > 2000) return Response.json({ error: 'Each brief field must be text up to 2,000 characters.' }, { status: 400 })
      brief[field] = body.brief[field].trim()
    }
    if (!brief.business || !brief.goal || !brief.offer || !brief.audience) return Response.json({ error: 'Business, goal, offer and audience are required.' }, { status: 400 })
    const result = await db.from('ava_onboarding').upsert({ user_id: user.id, mode: body.mode, brief, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (result.error) throw result.error
    return Response.json({ message: 'Your private onboarding brief was saved. Ava can use it for guidance.' })
  } catch (error) { return failure(error) }
}
