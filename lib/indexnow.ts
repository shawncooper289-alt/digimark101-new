const KEY = /^[A-Za-z0-9-]{8,128}$/

export function indexNowKey(env: Record<string, string | undefined> = process.env) {
  const key = env.INDEXNOW_KEY?.trim() || ""
  if (!KEY.test(key)) return null
  return key
}

export function indexNowKeyBody(expected: string | null, requested: string) {
  if (!expected || expected !== requested) return null
  return expected
}

export function indexNowPayload(input: { host: string; key: string; keyLocation: string; urls: string[] }) {
  const urls = input.urls.map((url) => url.trim()).filter((url) => {
    try {
      return new URL(url).protocol === "https:"
    } catch {
      return false
    }
  }).slice(0, 100)
  return {
    host: input.host,
    key: input.key,
    keyLocation: input.keyLocation,
    urlList: urls,
  }
}
