/**
 * Fetch and summarize a client website so Ava can understand niche, products, and pricing.
 */
export async function readWebsite(url: string): Promise<string | null> {
  try {
    const clean = url.startsWith("http") ? url : `https://${url}`
    const res = await fetch(clean, {
      headers: { "User-Agent": "AvaSkye/1.0 (DigiMark101)" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500)
    return text || null
  } catch {
    return null
  }
}

export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"']+|\b[a-z0-9-]+\.[a-z]{2,}(?:\/[^\s<>"']*)?/i)
  return match?.[0] ?? null
}
