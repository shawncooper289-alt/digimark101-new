import test from "node:test"
import assert from "node:assert/strict"
import { workspaceChange } from "../avaskye-online/src/lib/workspace-command.ts"
const owner = "12345678-1234-1234-1234-123456789abc"
const customer = "abcdefab-1234-1234-1234-123456789abc"

test("bookings require explicit timezone and valid customer UUID", () => {
  assert.equal(workspaceChange({ action: "book_appointment", title: "Call", startsAt: "2026-10-22T14:00:00" }, owner), null)
  assert.equal(workspaceChange({ action: "book_appointment", title: "Call", startsAt: "badZ" }, owner), null)
  assert.equal(workspaceChange({ action: "book_appointment", title: "Call", startsAt: "2026-10-22T14:00:00Z", customerId: "bad" }, owner), null)
  const change = workspaceChange({ action: "book_appointment", title: " Call ", startsAt: "2026-10-22T14:00:00-04:00", customerId: customer }, owner)
  assert.equal(change.table, "appointments")
  assert.equal(change.row.owner_id, customer)
  assert.equal(change.row.starts_at, "2026-10-22T18:00:00.000Z")
})

test("memory uses owner/key conflict and does not accept ownership fields", () => {
  const change = workspaceChange({ action: "save_memory", memoryKey: "Brand", memoryValue: "Blue", owner_id: customer }, owner)
  assert.equal(change.table, "client_memory?on_conflict=owner_id,memory_key")
  assert.equal(change.row.owner_id, owner)
  assert.equal(change.row.memory_value, "Blue")
  assert.equal(workspaceChange({ action: "save_memory", memoryKey: "Brand", memoryValue: " " }, owner), null)
})
