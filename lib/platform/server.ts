import 'server-only'
import { createClient } from '@supabase/supabase-js'

export class SetupError extends Error {}
export class AuthError extends Error {}
export function required(name: string) {
  const value = process.env[name]
  if (!value) throw new SetupError(`Configure ${name} in Vercel Settings.`)
  return value
}
export async function session(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) throw new AuthError('Sign in to use your private Ava workspace.')
  const db = createClient(process.env.NEXT_PUBLIC_digimark101_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || required('NEXT_PUBLIC_SUPABASE_URL'), process.env.NEXT_PUBLIC_digimark101_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_digimark101_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || required('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false },
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new AuthError('Your session expired. Please sign in again.')
  return { db, user: data.user }
}
export function failure(error: unknown) {
  return Response.json({ error: error instanceof SetupError || error instanceof AuthError ? error.message : 'The integration could not complete this request. Check configuration and try again.' }, { status: error instanceof AuthError ? 401 : error instanceof SetupError ? 503 : 502 })
}
export async function pinecone(path: string, body: unknown) {
  const host = new URL(required('PINECONE_INDEX_HOST'))
  if (host.protocol !== 'https:' || !host.hostname.endsWith('.pinecone.io')) throw new SetupError('PINECONE_INDEX_HOST must be your HTTPS Pinecone index endpoint.')
  const res = await fetch(new URL(path, host), { method: 'POST', headers: { 'Api-Key': required('PINECONE_API_KEY'), 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error('Pinecone request failed')
  return res.json()
}
