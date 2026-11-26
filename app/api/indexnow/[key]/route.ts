import { indexNowKey, indexNowKeyBody } from "@/lib/indexnow"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const body = indexNowKeyBody(indexNowKey(), key)
  if (!body) return new Response("Not found", { status: 404 })
  return new Response(body, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } })
}
