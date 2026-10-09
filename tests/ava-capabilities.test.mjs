import assert from 'node:assert/strict'
import { test } from 'node:test'
import { capabilityStatus, skills } from '../lib/ava/skills.ts'
test('all defined skills are advisory; missing providers never claim readiness', () => {
 const result = capabilityStatus({})
 assert.equal(result.skills.length, skills.length)
 assert.ok(result.skills.every(skill => skill.mode === 'advisory'))
 assert.equal(result.integrations.semanticMemory.status, 'not_configured')
 assert.equal(result.integrations.xResearch.status, 'not_configured')
 assert.equal(result.integrations.calls.status, 'not_implemented')
 assert.equal(result.integrations.automationExecution.status, 'not_implemented')
})
test('provider credentials indicate configuration, not verified connectivity', () => {
 const result = capabilityStatus({ PINECONE_API_KEY: 'test-only', PINECONE_INDEX_HOST: 'test-only', X_BEARER_TOKEN: 'test-only' })
 assert.equal(result.integrations.semanticMemory.status, 'configured_not_verified')
 assert.equal(result.integrations.xResearch.status, 'configured_not_verified')
 assert.equal(result.integrations.ai.status, 'requires_live_test')
})
