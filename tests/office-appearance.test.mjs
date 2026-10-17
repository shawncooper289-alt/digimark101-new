import assert from "node:assert/strict"
import test from "node:test"
import { visitorModeIntent, visitorModeReply } from "../lib/office/intent.ts"

test("guests are coming turns visitor mode on", () => {
  assert.equal(visitorModeIntent("Ava, guests are coming"), true)
  assert.equal(visitorModeIntent("switch to professional"), true)
})

test("back to casual turns visitor mode off", () => {
  assert.equal(visitorModeIntent("back to casual"), false)
  assert.equal(visitorModeIntent("the guests have left"), false)
})

test("the later phrase wins", () => {
  assert.equal(visitorModeIntent("switch to professional, then back to casual"), false)
  assert.equal(visitorModeIntent("back to casual. actually, guests are coming"), true)
})

test("unrelated studio questions do not change the look", () => {
  assert.equal(visitorModeIntent("Which package fits a small team?"), null)
  assert.equal(visitorModeIntent("Add a contact named Jordan Lee"), null)
})

test("replies name the active look", () => {
  assert.match(visitorModeReply(true), /professional/)
  assert.match(visitorModeReply(false), /casual/)
})
