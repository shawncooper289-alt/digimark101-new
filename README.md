# DigiMark101

Ava Skye-guided growth workspace built on Next.js, Vercel AI Gateway, and Supabase.

## Product foundation

- **Ava Guided** mode: collects a client goal, recommends next steps, and prepares approval-gated tasks.
- **Client Control** mode: keeps the client in control of all workspace operations while Ava remains available on demand.
- **Safety boundary**: publishing, credentials, access changes, financial actions, and destructive operations require explicit approval.

## Configure

The existing Vercel Supabase integration should provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The compatibility names currently attached to this project are also supported. Add `AI_GATEWAY_API_KEY` for local development; Vercel deployments may instead authenticate with `VERCEL_OIDC_TOKEN`.

Run `supabase/schema.sql` in the Supabase SQL editor, then deploy through the connected Git repository.
