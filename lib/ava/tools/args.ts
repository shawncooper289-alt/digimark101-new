const sensitiveParts = new Set(["token", "secret", "password", "card", "cvv", "cvc", "pan", "ssn"])

/** Match a whole word in the key. "company" contains "pan" and must stay. */
export function sensitiveKey(key: string) {
  const parts = key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  return parts.some((part) => sensitiveParts.has(part))
}
