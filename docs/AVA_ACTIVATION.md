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

## Website onboarding review
- Ask whether a website exists; obtain explicit consent to send its public URL/content to Firecrawl and the configured AI provider.
- Set FIRECRAWL_API_KEY in digimark101.com Settings > Environment Variables for Preview using protected inputs. No key is currently configured; no provider purchase made. Reader docs: https://docs.firecrawl.dev/api-reference/endpoint/scrape.
- Review/apply 20261009_ava_website_reviews.sql after the other migrations. Confirm two-account RLS isolation before activation.
- POST /api/platform/website reads ONE public page via Firecrawl, caps prompt content, drafts findings and saves them unconfirmed. Important product URLs can be submitted separately; this is not a full-site crawl. Missing or inaccessible content yields an explicit failure.
- Client corrects and confirms findings through PATCH before chat can retrieve the latest three confirmed briefs. Website statements are not independently verified product claims. No promotion, ad spend or publishing is performed by a review.
- No user-supplied URL is fetched directly by the app. HTTPS domains only; reject credentials, custom ports, IP literals and local/internal hostnames. Actual public-address/redirect enforcement is delegated to the managed reader, not claimed as app DNS verification. Do not replace this with unrestricted server-side fetch.
- One-minute per-user sequential scan cooldown is not a full concurrency-safe quota or cost ledger. Production rate limits/entitlements remain required. Live reader connectivity, redirect safety and prompt-injection robustness require provider/browser acceptance tests; sandbox cannot call Firecrawl or deployment URLs.

## Client app hub and assistant
- /apps contains 12 setup areas covering phone, AI staff, bot specifications, CRM, pages/funnels, campaigns, scheduling, workflows, social/reputation, ads, commerce/memberships and reporting. These are private CONFIGURATION DRAFTS, not activated apps or full All In One Marketing parity.
- Apply reviewed 20261009_ava_app_drafts.sql after staging validation; authenticated APIs save/load one draft per app per user. Bot builder stores a specification, not an executable bot. Multiple deployed bots, versioning and runtime are not implemented.
- Floating Ava appears on /workspace and all /apps pages. Text chat uses verified Supabase identity and page context. Beginner help can be switched off without disabling safety. Optional browser speech reads responses aloud; no microphone, approved Ava voice, calling or full-duplex voice is supplied. Toggles currently last for the mounted session only.
- backend project back-end-supabase-digimark101-new linked main repository contains README only at inspected commit 8fefc7bd5ffe0451dd439f62022cbad0c7bbacec. No functional backend application discovered there. This work stays in the DigiMark101 Next.js server routes and reviewed Supabase migration.
- Business-phone activation requires a chosen telephony provider, provider credentials/account or tenant subaccounts, provisioning and billing approval, country/compliance and number eligibility, verified webhook signatures, routing, call recording consent, unsubscribe/do-not-call safeguards and live acceptance tests. Existing TWILIO_FROM_NUMBER alone does not implement those.
- AI staff and bots need scoped tools, secure customer/provider OAuth credentials, versioned prompts/knowledge, approval enforcement, call/chat session state, human handoff, audit records, cost/concurrency limits and execution verification. Sales assistant must not promise sales or place unauthorized outbound calls.
- Remaining marketing parity requires independently implemented provider-connected modules and acceptance tests. These screens make future setup discoverable; they do not fulfill the full-platform request yet. No accounts/numbers purchased, calls placed, or production changed.
