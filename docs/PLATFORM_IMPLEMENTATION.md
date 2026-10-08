# DigiMark101 + Ava Skye implementation contract

Status: foundation only; no live payment, generation, or publishing integration.

## Architecture

One platform with two offers: AvaSkye.online (entry marketing partner) and DigiMark101.com (agency workspace). Separate frontend deployments are acceptable, but must use the same authorized identity and workspace backend. Do not consolidate or delete existing resources without inventory and approval.

Ava uses one approved voice identity across surfaces and supported languages. Client-created agents have independent voice and persona settings. Grok/xAI is a requested integration, not connected yet.

## Isolation and authorization

Never accept a browser-supplied user/workspace ID as authorization. Verify the session server-side and workspace membership on every request. Scope all memory, brand context, conversations, retrieval, tool execution, and object storage to that workspace. Enforce RLS and test using two distinct tenants. Service-role access bypasses RLS and must never reach the browser.

The existing initial_schema.sql is scaffolding, not a verified deployed schema. Audit profile update permissions: customers must not be able to set their own subscription entitlements. Message insert checks must verify conversation ownership, not only message user_id. Add explicit authorized memory policies and cross-tenant tests before enabling retrieval.

Separate global Ava knowledge from client memory. Default to learning within the client workspace only. Cross-client improvement requires permitted aggregated/de-identified data. Provide review, correction, export, deletion, retention controls, and audit trails.

## Ordered milestones and acceptance gates

1. Inventory domains, deployments, repositories, integrations and billing. Resolve outstanding invoice line items independently of usage estimates.
2. Auth + onboarding: verified sessions, isolated business profiles, existing-site questionnaire, products/prices/branding. Two-user isolation tests pass.
3. Checkout: confirmed prices, payment provider setup, verified signed webhooks, idempotent entitlements, cancellation/refund flows. Test mode purchase and failure tests pass before live mode.
4. Ava text/voice: approved voice, selected models, authorized memory retrieval, scoped tool registry, usage ledger and budget limits. No fabricated completion states.
5. Website creation: preview/edit/review/export or authorized publishing; persist revisions and allow rollback.
6. Email/social integrations: OAuth scopes, secure tokens, provider approval, revocation, approval-before-send/publish. Never promise unsupported provider operations.
7. Ava Studio: storyboard, scene assembly, generation/editing, lip-sync evaluation, rendering jobs and export. Length and quality depend on tested provider limits. Require likeness/voice rights.
8. Automation: durable task states, delegation, retries, idempotency, audit logs and visible failure/approval status. Spending, destructive changes and publishing require explicit authorization.
9. Invite-only beta: capped credits, consenting analytics, feedback, failure tracking and cost-per-workflow measurement. No guaranteed sales or monetization claims.

## Usage economics

Track text/agents, voice, images, video, and email/SMS separately. Reserve credit before work, reconcile actual cost, prevent concurrent overspending, and define failed-job refunds. Display estimates and require opt-in recharge. Proposed retail multipliers and previous plan prices are NOT approved production prices. Final pricing requires model costs, payment fees, overhead, included allowances, and margin targets.

## Owner inputs

- Confirm authoritative domains, connected team, and intended existing databases.
- Agency deliverables and human-support obligations versus self-service features.
- Approve plan prices/allowances after cost review; taxes, refund/cancellation rules, and business details.
- Payment provider account and secure credential setup (test first).
- Ava reference voice and likeness/voice rights; preferred generation/voice providers.
- Provider accounts for xAI and video generation; email sender/domain; social/YouTube developer apps and consent flows.
- Brand assets, contact details, policies, beta audience and testers.

Secrets must be supplied through protected environment-variable/provider setup, never pasted into chat or committed.
