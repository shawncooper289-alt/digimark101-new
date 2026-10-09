export function publicWebsiteUrl(input: unknown): string {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Enter a public HTTPS website URL.')
  const url = new URL(input)
  const host = url.hostname.toLowerCase()
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !host.includes('.') || /[:\[\]]/.test(host) || /^[0-9.]+$/.test(host) || /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)) throw new Error('Use a public HTTPS domain, without credentials or a custom port.')
  url.hash = ''
  return url.toString()
}
