import { session, failure, required } from '@/lib/platform/server'
export async function GET(req: Request) {
  try {
    await session(req)
    const query = new URL(req.url).searchParams.get('q') || ''
    if (!query.trim() || query.length > 200) return Response.json({ error: 'Enter a search up to 200 characters.' }, { status: 400 })
    const url = new URL('https://api.x.com/2/tweets/search/recent')
    url.searchParams.set('query', query)
    url.searchParams.set('max_results', '10')
    const res = await fetch(url, { headers: { Authorization: `Bearer ${required('X_BEARER_TOKEN')}` }, signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error('X search unavailable')
    const data = await res.json()
    return Response.json({ posts: data.data || [] })
  } catch (e) { return failure(e) }
}
