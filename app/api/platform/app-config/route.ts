import { session, failure } from '@/lib/platform/server'
import { apps } from '@/lib/ava/apps'
export async function POST(req: Request) {
 try {
  const { db, user } = await session(req)
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }) }
  const app = apps.find(app => app.id === body?.app)
  if (!app || !body.config || typeof body.config !== 'object') return Response.json({ error: 'Unknown app or invalid configuration.' }, { status: 400 })
  const config: Record<string,string> = {}
  for (const field of app.fields) { if (typeof body.config[field] !== 'string' || body.config[field].length > 2000) return Response.json({ error: 'Each field must be text up to 2,000 characters.' }, { status: 400 }); config[field] = body.config[field].trim() }
  const result = await db.from('ava_app_drafts').upsert({ user_id: user.id, app: app.id, config, updated_at: new Date().toISOString() }, { onConflict: 'user_id,app' })
  if (result.error) throw result.error
  return Response.json({ message: 'Private setup draft saved. No provider account or live agent was created.' })
 } catch (error) { return failure(error) }
}
export async function GET(req: Request) {
 try {
  const { db, user } = await session(req)
  const app = new URL(req.url).searchParams.get('app')
  if (!apps.some(item => item.id === app)) return Response.json({ error: 'Unknown app.' }, { status: 400 })
  const result = await db.from('ava_app_drafts').select('config').eq('user_id', user.id).eq('app', app).maybeSingle()
  if (result.error) throw result.error
  return Response.json({ draft: result.data }, { headers: { 'Cache-Control': 'no-store' } })
 } catch(error) { return failure(error) }
}
