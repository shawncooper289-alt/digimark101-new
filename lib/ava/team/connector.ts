import { timingSafeEqual } from "node:crypto"

export function connectorAuthorized(header: string | null, secret: string | undefined) {
  const expected = secret?.trim() || ""
  if (!expected) return false
  const match = header?.match(/^Bearer\s+(\S+)$/i)
  const got = match?.[1] || ""
  if (!got) return false
  const left = Buffer.from(got)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function connectorOwnerId(env: Record<string, string | undefined>) {
  return env.MUSE_OWNER_USER_ID?.trim() || env.LEAD_OWNER_USER_ID?.trim() || ""
}
