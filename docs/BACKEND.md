# DigiMark101 backend

The database is Supabase Postgres. SQL lives in `supabase/migrations` and runs in filename order. `supabase/config.toml` is the local project config. `lib/supabase/types.ts` is generated from the public schema after those files apply.

The Supabase CLI was not available in this environment. The files were applied with local Postgres 16, including a second run to confirm they are idempotent. A contact, deal, email campaign, funnel, automation, booking, and premium lead promotion all wrote the related rows.

## Migration order

| File | What it adds |
| --- | --- |
| `20261007_workspace.sql` | Early `digimark_workspace` notes |
| `20261015_leads.sql` | Contact-form `leads`. Personal details, no anon access |
| `20261015_platform.sql` | Studio tables the app writes: contacts, deals, appointments, threads, messages, campaigns, sites, automations, memory, files |
| `20261016_subscriptions.sql` | PayPal `subscriptions` |
| `20261017_leads_engine.sql` | Staging, premium records, private contacts, suppression, orders |
| `20261017_managed_backends.sql` | White-label project row, and `is_owner()` so later policies can compile |
| `20261017_office_appearance.sql` | Visitor mode |
| `20261017_owner_office_access.sql` | Owner read of lead personal details |
| `20261017_owner_role.sql` | Owner stamp from `OWNER_EMAIL` |
| `20261018_complete_backend.sql` | Workspaces, CRM extras, pipelines, email, funnels, bookings, lead niches and audit, Ava config, PayPal plans and webhook log, provisioning jobs, affiliate links |
| `initial_schema.sql` | Profiles and the older Ava conversation tables. Idempotent, and it sorts after the dated files |

## Who can see what

Row level security is on every public table.

- A workspace member sees rows in workspaces they belong to. `owner_id` still matches the signed-in user, which is how the studio writes today.
- The owner (`is_owner()`, stamped from `OWNER_EMAIL`) is not capped on workspaces.
- Full lead personal details stay in `lead_private_contacts`. Authenticated clients have no policy that returns those rows. The owner can select them. The service role, which is Ava's server key, bypasses RLS and is the only writer.
- `lead_consent`, `lead_enrichment`, `lead_audit`, and `paypal_webhook_events` follow the same owner-or-service rule.
- `lead_store` and `lead_previews` are the anonymized premium views. They do not include email, phone, or name.
- `leads` (the contact form) is revoked from anon and authenticated.

## How the app writes

The studio still upserts `contacts`, `deals`, `appointments`, `threads`, `thread_messages`, `campaigns`, `sites`, `automations`, and `client_memory`. Triggers copy those writes into companies, notes, pipelines, stages, email lists, funnels, pages, automation steps, calendars, and bookings. The buyer store reads `lead_store`, and falls back to `lead_records` if that view is not installed yet.

`affiliate_links` is the stored partner config. Empty rows stay disabled, and the site keeps using `SUPABASE_AFFILIATE_URL` and `VERCEL_AFFILIATE_URL` until an enabled https link is saved.

## Jobs

Vercel already runs these routes. The edge functions in `supabase/functions` write the same tables when invoked with `Authorization: Bearer $CRON_SECRET`. Use one scheduler, not both, for qualify.

| Job | Next.js route | Edge function |
| --- | --- | --- |
| Intake | `POST /api/leads/import` and the contact form | `leads-collect` inserts `lead_staging` |
| Qualify and niche | `GET /api/cron/leads` scores, enriches, and promotes | `leads-qualify` calls `promote_premium_leads` |
| Opt out | `POST /api/leads/opt-out` | `leads-opt-out` upserts `lead_suppressions` |
| PayPal | `POST /api/webhooks/paypal` verifies the signature, writes `subscriptions`, and logs `paypal_webhook_events` | `paypal-webhook` only logs an already trusted event |
| Provision | `POST /api/managed/backend` calls the Management API and writes `managed_backends` plus `provisioning_jobs` | `platforms-provision` records the job and calls the Management API when the token is present |
| Ava memory | Studio confirm on `client_memory` | `ava-memory` upserts one memory row |

Phone calling is still not connected. Campaign sends stay drafts until an email provider is added.
