/** Only editable fields from the existing shared sites schema. No publish side effects. */
export function contentChange(body: Record<string, unknown>) {
  const id = typeof body.id === "string" ? body.id : ""
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const headline = typeof body.headline === "string" ? body.headline.trim() : ""
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null
  if (!name || name.length > 160 || headline.length > 500) return null
  return { id, patch: { name, headline } }
}
