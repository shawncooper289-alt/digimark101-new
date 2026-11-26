import { createHmac, timingSafeEqual } from "node:crypto"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isOrderId(value: string) {
  return UUID.test(value)
}

export function signDelivery(orderId: string, exp: number, secret: string) {
  return createHmac("sha256", secret).update(`${orderId}.${exp}`).digest("base64url")
}

export function deliverySigOk(orderId: string, exp: number, sig: string, secret: string, now = Date.now()) {
  if (!isOrderId(orderId) || !secret || !sig || !Number.isFinite(exp)) return false
  if (exp * 1000 < now) return false
  const expected = signDelivery(orderId, exp, secret)
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function confirmationPath(orderId: string, secret: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + 14 * 24 * 60 * 60
  const sig = signDelivery(orderId, exp, secret)
  return `/store/confirmation?order=${orderId}&exp=${exp}&sig=${encodeURIComponent(sig)}`
}
