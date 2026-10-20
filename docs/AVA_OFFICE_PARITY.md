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
