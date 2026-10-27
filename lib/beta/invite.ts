import { timingSafeEqual } from "crypto"

/** Open signup when BETA_INVITE_CODE is unset or blank. */
export function betaInviteAccepted(given: unknown) {
  const expected = process.env.BETA_INVITE_CODE?.trim() ?? ""
  if (!expected) return true
  if (typeof given !== "string") return false
  const left = Buffer.from(given.trim())
  const right = Buffer.from(expected)
  if (left.length !== right.length || left.length === 0) return false
  return timingSafeEqual(left, right)
}
