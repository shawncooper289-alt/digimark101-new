import assert from "node:assert/strict"
import test from "node:test"
import { contentChange } from "../avaskye-online/src/lib/content-command.ts"

const id = "12345678-1234-1234-1234-123456789abc"

test("content edits allow only name and headline, never ownership or publish state", () => {
  assert.deepEqual(contentChange({ id, name: " Shared page ", headline: " Hello ", owner_id: "other", status: "published", path: "/changed" }), {
    id, patch: { name: "Shared page", headline: "Hello" },
  })
})

test("content edits reject invalid ids, blank names, and oversized values", () => {
  for (const body of [
    { id: "bad&id=not.is.null", name: "Site" },
    { id, name: "  " },
    { id, name: "a".repeat(161) },
    { id, name: "Site", headline: "a".repeat(501) },
  ]) assert.equal(contentChange(body), null)
})

test("headlines may be cleared without changing publish state", () => {
  assert.deepEqual(contentChange({ id, name: "Site" }), { id, patch: { name: "Site", headline: "" } })
})
