# Ava activation and acceptance

This branch consolidates the platform-foundation landing, PR #11 knowledge/chat/documents/read-only X implementation, and a new authenticated onboarding flow. It does not merge entire divergent redesign branches. Route: /workspace. Production is not changed.

## Delivered
- Ten explicitly advisory capability categories, with provider status metadata that never exposes values or equates configuration with connectivity.
- Authenticated onboarding GET/POST, saved business/site/offer/audience/goal/voice/budget/compliance and guided/self-directed mode.
- Server-verified Supabase identity, owner-filtered onboarding and chat retrieval; RLS migration for personal workspace isolation.
- Onboarding context and core Ava knowledge supplied to chat as untrusted reference data, not privileged instructions.
- AI Gateway chat, optional Pinecone retrieval with Supabase fallback, and read-only X research source wiring.
- Unauthenticated API requests return 401; provider failure is not reported as completion.
- Framework patched to 16.3.8. Client responses discarded after account changes.

## Required activation (not executed)
1. Confirm the DIGIMARK Supabase resource is the intended database. Review/apply 20261003_workspace.sql and 20261009_ava_onboarding.sql in a staging database first. Existing initial_schema.sql is not used for these new routes and remains unaudited scaffolding. Do not blindly rerun policy creation on an existing database.
2. Configure Supabase email authentication and preview redirect allowlist. Use two real accounts to prove A cannot read, edit or insert B's onboarding, documents or messages using both API and direct Supabase queries. Test sign-out/account switching while a request is pending. Shared/team workspaces are not implemented; isolation is per account.
3. Vercel digimark101.com > Settings > Environment Variables: public DIGIMARK Supabase URL and anon/publishable key are required. Existing names are supported. Never use service-role credentials for this frontend. Existing configuration presence does not prove valid provider values.
4. Verify AI Gateway model access, billing/credits and an authenticated chat. Optional AVA_MODEL chooses a Gateway model (including approved Grok model only after verification); default remains openai/gpt-4.1-mini. No credential or purchase was made by this change.
5. Optional Pinecone requires PINECONE_API_KEY and PINECONE_INDEX_HOST; embedding defaults to openai/text-embedding-3-small with a matching 1536-dimensional index. X_BEARER_TOKEN enables read-only X recent search, subject to provider permissions. Supply credentials securely in Vercel, never in chat.
6. Verify saved brief reload and personalized guidance, private document save/retrieval, persistence failures, missing-provider errors, and model failure behavior in the deployed preview. Sandbox cannot request deployment URLs or external providers.

## Not delivered / not launch-ready
- Durable specialist execution, retries, scheduling, approval audit records or shared tenant membership.
- Approved voice identity, generated audio, phone calls, studio video/rendering and likeness rights.
- CRM/email/calendar/social publishing OAuth tools and provider accounts.
- Checkout lifecycle, signed payment webhooks, entitlements, quotas, rate limiting and usage/budget ledger. Do not expose this preview as a public paid service.
- Verified deployed RLS, provider end-to-end tests, memory retention/export/delete controls and provider lifecycle cleanup.

These require further implementation and provider/database access, not merely additional API keys. Prompt expertise is not execution authority. Publishing, spending, destructive work and access changes must be server-enforced and explicitly approved before tools are added.
