export type ApprovalEffect = "read" | "write" | "destructive" | "outbound"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired"

export type ApprovalBinding = {
  status: ApprovalStatus
  actorId: string
  tool: string
  target: string
  params: Record<string, unknown>
  expiresAt: string
}

export type ApprovalRequest = {
  actorId: string
  tool: string
  target: string
  params: Record<string, unknown>
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null"
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`
}

export function approvalHash(input: Pick<ApprovalRequest, "tool" | "target" | "params">) {
  return stableStringify({ tool: input.tool, target: input.target, params: input.params })
}

export function checkApproval(row: ApprovalBinding, request: ApprovalRequest, now: Date) {
  if (row.status !== "pending" && row.status !== "approved") {
    return { ok: false, reason: "That approval is already closed." }
  }
  if (new Date(row.expiresAt).getTime() <= now.getTime()) {
    return { ok: false, reason: "That approval has expired. Nothing was sent." }
  }
  if (row.actorId !== request.actorId) {
    return { ok: false, reason: "That approval is for a different person." }
  }
  if (row.tool !== request.tool) {
    return { ok: false, reason: "That approval is for a different tool." }
  }
  if (row.target !== request.target) {
    return { ok: false, reason: "That approval is for a different target." }
  }
  if (stableStringify(row.params) !== stableStringify(request.params)) {
    return { ok: false, reason: "That approval does not match these details." }
  }
  return { ok: true, reason: "The owner approval matches." }
}

export const APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function approvalExpiry(now: Date) {
  return new Date(now.getTime() + APPROVAL_TTL_MS).toISOString()
}
