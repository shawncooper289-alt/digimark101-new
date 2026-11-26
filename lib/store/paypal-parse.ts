export function centsFromAmount(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null
  const [dollars, fraction = ""] = value.split(".")
  return Number(dollars) * 100 + Number(fraction.padEnd(2, "0"))
}

function record(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export type ParsedCapture = {
  captureId: string
  status: string
  amountCents: number
  currency: string
  customId: string | null
  paypalOrderId: string | null
  email: string
}

/** Reads a PayPal Orders v2 capture response, or a PAYMENT.CAPTURE.COMPLETED resource. */
export function readCapture(payload: unknown): ParsedCapture | null {
  const body = record(payload)
  if (!body) return null

  const units = Array.isArray(body.purchase_units) ? body.purchase_units : null
  const unit = record(units?.[0])
  const payments = record(unit?.payments)
  const captures = Array.isArray(payments?.captures) ? payments.captures : null
  const nested = record(captures?.[0])
  const source = nested ?? body
  const captureId = text(source.id)
  const status = text(source.status) || text(body.status) || ""
  const amount = record(source.amount)
  const currency = text(amount?.currency_code)
  const rawAmount = text(amount?.value)
  const amountCents = rawAmount ? centsFromAmount(rawAmount) : null
  if (!captureId || amountCents === null || !currency) return null

  const customId = text(source.custom_id) || text(unit?.custom_id) || text(body.custom_id)
  const related = record(record(source.supplementary_data)?.related_ids) || record(record(body.supplementary_data)?.related_ids)
  const paypalOrderId = text(body.id && units ? body.id : null) || text(related?.order_id)
  const payer = record(body.payer)
  const email = (text(payer?.email_address) || "").toLowerCase()

  return { captureId, status, amountCents, currency, customId, paypalOrderId, email }
}
