export function workspaceChange(body: Record<string, unknown>, ownerId: string) {
  const owner = typeof body.customerId === "string" && body.customerId.trim() ? body.customerId.trim() : ownerId
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner)) return null
  const value = (key: string, max: number) => typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : ""
  if (body.action === "book_appointment") {
    const title = value("title", 160)
    const starts = value("startsAt", 80)
    // Require an explicit timezone; never guess the owner's timezone on the server.
    if (!title || !/(Z|[+-]\d{2}:\d{2})$/.test(starts) || !Number.isFinite(Date.parse(starts))) return null
    return { table: "appointments", row: { owner_id: owner, title, starts_at: new Date(starts).toISOString(), contact_name: value("contactName", 160), notes: value("notes", 2000) } }
  }
  if (body.action === "save_memory") {
    const key = value("memoryKey", 160)
    const memory = value("memoryValue", 2000)
    if (!key || !memory) return null
    return { table: "client_memory?on_conflict=owner_id,memory_key", row: { owner_id: owner, memory_key: key, memory_value: memory, updated_at: new Date().toISOString() } }
  }
  return null
}
