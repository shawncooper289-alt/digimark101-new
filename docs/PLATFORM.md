# Studio platform

DigiMark101 is the marketing site plus a client workspace. The workspace is meant to stay simpler than a typical all-in-one CRM: one sidebar, one job per screen, and Ava Skye on every page.

## What works in this release

Signed-in clients get their own rows in Supabase. Policies use `auth.uid() = owner_id`, so one login cannot read another client's contacts, deals, appointments, inbox, campaigns, sites, automations, files, or Ava memory.

| Screen | What it does now |
| --- | --- |
| Today | Counts for this workspace only |
| Contacts | Create and list people |
| Pipeline | Deals in new, qualified, proposal, won, lost |
| Calendar | Book a date and time |
| Inbox | Log a note. Automations can write here too |
| Campaigns | Save a draft. Nothing is sent |
| Sites | Register a draft site or funnel. Nothing is published |
| Automations | Three triggers: contact created, appointment booked, deal moved. Two actions: log an inbox note, or save a memory |
| Reports | Counts of your rows. No benchmarks |
| Files | Upload into a private Storage folder named with your user id |
| Memory | Facts Ava stores for this client only |

Ava can do those same actions from any page, open a section, and fill a form that is on the screen. Type, or use the Voice toggle. Voice input and spoken replies use the browser's Web Speech API. No ElevenLabs or other speech account is required. Chrome and Edge support dictation. Spoken replies work in any browser with `speechSynthesis`.

Without Supabase keys, the studio opens in a preview that stays in this browser. It is labeled as a preview. It is not isolated per client. Sign in after the migration to get real isolation.

## Accounts and environment

1. [Supabase](https://supabase.com): create a project. In the SQL editor run `supabase/migrations/20261015_platform.sql`. Run `supabase/migrations/20261015_leads.sql` as well if you want the public contact form to store inquiries. The older `initial_schema.sql` is optional and is not used by the studio screens.
2. In Supabase Auth, decide whether new emails must be confirmed. The signup screen explains both outcomes.
3. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Set `SUPABASE_SERVICE_ROLE_KEY` only for the public lead form. Do not use the service role for studio data. It bypasses row-level security.
4. For live Ava, set one model key: `XAI_API_KEY` (default model `grok-4.7`), or `OPENAI_API_KEY` (default `gpt-4o-mini`), or `AVA_LLM_API_KEY` with `AVA_LLM_BASE_URL` and `AVA_LLM_MODEL`. With no key, Ava still runs the studio commands she recognizes and fills forms from what she hears.
5. Speech: no account. Allow the microphone in the browser.

## Later phases

These are not in this release. The screens say so where someone could mistake a draft for a finished product.

1. Visual site and funnel builder, with publishing on a client domain.
2. Campaign sending through an email provider, then SMS.
3. Inbox connectors for email and social, not just notes logged here.
4. Public booking links, availability, and Google or Outlook calendar sync.
5. A broader automation runner and a visual builder. The three triggers above are the whole engine today.
6. Reporting connectors for ad platforms and analytics. Reports will keep using approved numbers only.
7. More than one person inside a client workspace, with roles.
8. Proposal invoices, and any billing beyond the three PayPal membership plans. Membership checkout itself is on the pricing page when the PayPal env vars are set.
9. Optional paid text-to-speech. Browser speech remains the default.
