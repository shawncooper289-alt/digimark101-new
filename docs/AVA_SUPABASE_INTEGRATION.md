# Ava Skye + Supabase integration

Ava is the client-facing chief of staff. Specialist agents run only as delegated work inside a workspace.

## Security boundary

- Browser clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the migration's row-level security.
- Ava's server integration uses `SUPABASE_SERVICE_ROLE_KEY`; it must stay in server-only Vercel environment variables.
- The service-role client manages memberships, creates `agent_runs`, stores specialist output, and updates work state after validating the caller's workspace membership.
- Publishing, spending, sending, or automated external changes must create an `approvals` record and wait for an approved decision. Do not let browser code write `agent_runs` or bypass approvals.

## Request contract

The Ava app sends an authenticated command shaped as `AvaCommand` from `lib/ava-contract.ts`. The receiving route must:

1. Resolve the authenticated user and verify membership in `workspaceId`.
2. Persist the user's message in `ava_thread_messages`.
3. Create or update a `work_items` record.
4. For delegation, create an `agent_runs` record with the specialist agent and immutable input.
5. For an external side effect, create an `approvals` record and stop until an owner/admin approves it.
6. Persist the final Ava response and agent output for auditability.

## Tier and white-label controls

Use `workspaces.subscription_tier` for Startup, Growth, and Elite. Use `entitlement_overrides` for limits such as seats, clients, automation runs, specialist agents, and white-label access. `workspace_branding` holds branded-portal settings; `white_label_mode = 'reseller'` unlocks the second, full agency/reseller option.

## Apply the migration

This environment cannot reach the live Supabase database. From a machine with Supabase access, review and apply `supabase/migrations/20260816_ava_platform_foundation.sql` with the Supabase CLI or SQL Editor. Back up the database first and run it in a staging project before production.
