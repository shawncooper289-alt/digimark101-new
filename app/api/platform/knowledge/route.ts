import { embed } from 'ai'
import { session, failure, pinecone } from '@/lib/platform/server'
export async function GET(req: Request) {
  try {
    const { db } = await session(req)
    const { data, error } = await db.from('ava_documents').select('id,title,content,indexed,created_at').order('created_at', { ascending: false }).limit(30)
    if (error) throw error
    return Response.json({ documents: data })
  } catch (e) { return failure(e) }
}
export async function POST(req: Request) {
  try {
    const { db, user } = await session(req)
    const body = await req.json()
    if (typeof body.title !== 'string' || typeof body.content !== 'string' || !body.title.trim() || !body.content.trim() || body.title.length > 160 || body.content.length > 12000) return Response.json({ error: 'Provide a title (160 characters max) and content (12,000 characters max).' }, { status: 400 })
    const { data, error } = await db.from('ava_documents').insert({ user_id: user.id, title: body.title, content: body.content }).select('id').single()
    if (error) throw error
    let indexed = false
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
      try {
        const { embedding } = await embed({ model: process.env.AVA_EMBEDDING_MODEL || 'openai/text-embedding-3-small', value: body.content })
        await pinecone('/vectors/upsert', { namespace: user.id, vectors: [{ id: data.id, values: embedding }] })
        const updated = await db.from('ava_documents').update({ indexed: true }).eq('id', data.id)
        if (updated.error) throw updated.error
        indexed = true
      } catch { /* Supabase remains the source of truth; never claim indexing succeeded. */ }
    }
    return Response.json({ id: data.id, indexed, message: indexed ? 'Saved in Supabase and indexed in Pinecone.' : 'Saved in Supabase. Pinecone indexing is pending; configure the index and re-save to retry.' })
  } catch (e) { return failure(e) }
}
