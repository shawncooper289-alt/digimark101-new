const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export function decodeBase64(input: string) {
  const clean = input.replace(/[^A-Za-z0-9+/]/g, "")
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const char of clean) {
    const value = ALPHABET.indexOf(char)
    if (value < 0) continue
    buffer = (buffer << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 255)
    }
  }
  return Uint8Array.from(bytes)
}
