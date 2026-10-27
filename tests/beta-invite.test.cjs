const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const ts = require("typescript")

function loadInvite() {
  const code = ts.transpileModule(fs.readFileSync("lib/beta/invite.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, { exports: module.exports, module, require, process, Buffer })
  return module.exports
}

test("beta signup is open when the invite code is unset", () => {
  delete process.env.BETA_INVITE_CODE
  const { betaInviteAccepted } = loadInvite()
  assert.equal(betaInviteAccepted(""), true)
  assert.equal(betaInviteAccepted(undefined), true)
})

test("a set invite code must match", () => {
  process.env.BETA_INVITE_CODE = "wave-1"
  const { betaInviteAccepted } = loadInvite()
  assert.equal(betaInviteAccepted("wave-1"), true)
  assert.equal(betaInviteAccepted("wave-2"), false)
  assert.equal(betaInviteAccepted("wave-1 "), true)
  delete process.env.BETA_INVITE_CODE
})

test("the media migration uses the live column names", () => {
  const sql = fs.readFileSync("supabase/migrations/20261027_media_business_builds.sql", "utf8")
  assert.match(sql, /owner_id uuid not null/)
  assert.match(sql, /kind text not null/)
  assert.match(sql, /public_url text/)
  assert.match(sql, /primary key \(campaign_id, media_id\)/)
  assert.match(sql, /create or replace function public\.can_access_workspace\(p_workspace_id uuid, p_owner_id uuid\)/)
  assert.ok(sql.indexOf("create or replace function public.can_access_workspace") < sql.indexOf("create policy client_media_access"))
  assert.match(sql, /alter table public\.campaigns\s+add column if not exists workspace_id/)
  assert.match(sql, /is_owner\(\)/)
  assert.match(sql, /legal_business_name/)
  assert.match(sql, /ein_tax_id/)
  assert.match(sql, /privacy_policy_url/)
  assert.equal(sql.includes("media_type text"), false)
  assert.equal(sql.includes("legal_name text"), false)
  assert.equal(sql.includes("add column if not exists ein text"), false)
})

test("beta feedback lets the user insert and only the owner read", () => {
  const sql = fs.readFileSync("supabase/migrations/20261028_beta_onboarding.sql", "utf8")
  assert.match(sql, /create policy beta_feedback_insert/)
  assert.match(sql, /auth\.uid\(\) = user_id/)
  assert.match(sql, /using \(public\.is_owner\(\)\)/)
  assert.match(sql, /onboarding_sessions/)
  assert.match(sql, /outcome in \('completed', 'skipped', 'corrected'\)/)
  assert.equal(sql.includes("answer text"), false)
})
