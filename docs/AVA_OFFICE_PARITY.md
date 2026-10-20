# Ava main office coverage

The reference is `vercel-agent/grok-complete-build` (c2ea696). The office is a separate Next.js application in this repository, not a copy of the root customer studio. Its owner session uses `ava_office`; customer studio sessions use Supabase SSR cookies. Do not forward or copy browser sessions between hosts.

## Shared identity and engine

The office imports the existing root `lib/ava/respond.ts`, its knowledge base, identity, site facts, and membership facts directly through TypeScript aliases. Those files remain a single source of truth. No separate AI persona or copied knowledge base was created. The office supplies owner-context instructions, not a replacement identity.

The office has its own credential scope. Without XAI_API_KEY (or a supported alternative) it returns an explicitly non-live guide response. The new companion panel labels this; sharing a database does not share provider credentials. Do not paste credentials into source control or client components.

## Coverage

- Contacts/CRM, leads, pipeline, campaigns, automations, subscriptions, business records, clients, reports, and managed-backend review: existing office screens.
- Site content: confirmed edits of shared names/headlines; no website deployment or publish operation.
- Calendar: platform-wide read and confirmed appointment creation, including customer account targeting. Explicit timezone required. No external invites.
- Memory: platform-wide read and confirmed owner/key upsert, including customer targeting.
- Inbox: read threads plus the latest 200 platform-wide messages. No outbound email or provider inbox sync.
- Files: metadata review only. No private storage download, upload, or deletion.
- Ava: enlarged persistent portrait and conversation panel on non-home screens. Existing large home-desk scene remains. Private knit outfit vs professional visitor outfit; the public-site wardrobe is unchanged.

## Not yet equivalent to every Grok agent tool

The customer studio's `answerAva` tool executor is not reused: it assumes a different session and client workspace. Office open-ended questions share the response engine, but do not automatically get those tools. Existing contact drafts and navigation remain; appointments and memories use explicit forms. Full conversation-driven deal creation, inbox notes, site creation, and all customer studio CRUD flows are not yet ported. Do not claim complete functional parity or that natural-language commands executed writes.

Billing is read-only, reports are operational summaries rather than visitor analytics, and existing campaign/automation integrations do not become external delivery services merely by appearing in the office.

## Before live rollout

Review PR changes and verify owner login, non-owner denial, read permissions, and confirmed writes on deliberately chosen test records. Preview currently has public Supabase config but no administration key or live AI key. Configure these through Vercel protected environment inputs in the intended environments; do not broaden access automatically. Production-only credentials are not available to a preview.

No database migration is introduced. Checkout, webhooks, and scheduled jobs continue on DigiMark101. This preview does not change production domains or data.

## Audit follow-up: knowledge, niches, and briefings

- `/skills` renders every recorded skill group and named framework directly from the shared registry, with links to relevant office screens. Reasoning instructions require objectives, evidence, assumptions, alternatives, risks, and next action; this is not a guarantee of model reasoning quality.
- `/niches` reads the persisted `lead_niches` registry and requests exact per-niche premium and shareable counts. Shareable requires premium + sellable + consent_share. Counts are not limited to a sampled lead list. Existing code does not establish exclusive/unallocated stock.
- `/briefings` preserves one generated planning brief per UTC day in owner-scoped memory, with duplicate-safe insertion. Model fallback is not recorded as a live briefing. No fresh-market research source or scheduler is attached: these are explicitly labeled planning hypotheses, manually requested.

### Remaining acceptance blockers

Do not declare the full build attached or fully operational yet:
1. Several `answerAva` tool-executor actions remain absent from the office conversation path. Sharing knowledge and `respondToAva` is not full agent parity.
2. No autonomous all-record maintenance/audit worker or persisted niche-creation workflow is connected.
3. No scheduled daily briefing delivery or sourced new-opportunity research is connected. A scheduler, chosen research source, protected credentials, and operational policy are needed.
4. Office AI and administration credentials are not configured for preview. Live model calls, owner login, schema compatibility, writes, and scheduler delivery remain unverified.
5. Provider billing, email delivery, phone calling, private file operations, and bot provisioning are not made operational by this work.

The build and mocked regression tests validate code paths, not production acceptance. Production rollout remains deliberately unperformed.
