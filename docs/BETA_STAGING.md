# Isolated beta staging — preparation kit

Status: source tooling prepared; **these scripts do not provision a hosted backend, create mailboxes, apply migrations or deploy frontends**. An unconnected provider resource is not yet an activated test environment. A preview URL alone is not isolation: existing Preview settings may still use the production database.

## Intended layout

Two staging frontends (customer app at repo root; private office at `avaskye-online`) share ONE fresh staging Supabase project. That project must differ from the backend used by both production sites. Use no production customer rows, Auth users, storage files, tokens, payment credentials or owner mailbox allowlist. Create three controlled test mailboxes: one test owner and customers A/B. The actual founder account is not a test fixture.

## Provisioning gate

Choose a fresh isolated Supabase project or a verified-empty resource. Review cost and billing before provisioning/resuming anything. A provider resource reported as suspended is not a ready staging database. Do not silently connect or resume an old resource, and never solve staging by reusing production.

Vercel supports scoping a Marketplace resource to a Custom Environment: [official storage instructions](https://vercel.com/docs/marketplace-storage). For each of the two projects, use a dedicated `staging` environment and connect ONLY the staging resource to it. Clear built-in Production/Preview/Development selections on that connection unless explicitly intended. Do not clone production secrets into staging. Existing deployments need a new build after changing variables. Use installed CLI help for deployment syntax.

No Vercel resources or environment settings are provisioned by this PR. No DB provisioning fee has been approved. Once the isolated resource is available, a separate approved configuration/deployment step is needed for both frontends.

## Backend and app configuration

1. In the fresh database, apply `supabase/migrations` in documented byte-order (see `docs/BACKEND.md`). Do not apply migrations to a database selected from a production env file. This kit does not apply migrations and does not prove hosted schema compatibility.
2. Configure Auth email delivery to controlled test mailboxes or an approved mail sandbox. Email delivery is not faked by the scripts. Keep email confirmation on. Allow the exact customer staging callback/reset paths and office staging callback path. Use staging origins, not production Site URL defaults. A shared backend has one Site URL; explicit redirects must be allowlisted for both apps.
3. Both apps: all supported public Supabase URL aliases must identify the staging backend; public keys must belong to it. Server-only Supabase service keys must belong to that same staging backend. Customer app `NEXT_PUBLIC_SITE_URL` is its staging origin; office `OFFICE_PUBLIC_URL` is its staging origin. `OWNER_EMAIL` contains ONLY the test owner mailbox; unset `LEAD_OWNER_USER_ID` unless deliberately configured for that fixture.
4. Do not install production PayPal, social OAuth, AI, email, lead-import, cron or management/provisioning credentials. Only add explicitly approved sandbox credentials later. Deploy no scheduler jobs for this first pass. No live purchases, campaigns, publishing, calls or paid resource creation.
5. Review every environment alias/override before deployment. These command-line guards protect these scripts only; they are not an application deployment guard or proof that Vercel variables are isolated.

## Protected local fixture inputs

Run from the repository root on a trusted machine with Node and `npm ci` completed. This assistant sandbox cannot directly reach hosted Supabase; run live fixture commands in an authorized environment that can. Use a protected local env file or secret manager; never paste keys/passwords/login links into chat or commit them. Do not print the env file.

Required variables:

| Variable | Purpose |
|---|---|
| `BETA_STAGE_ACK` | Exactly `isolated-test-data-only` |
| `BETA_PRODUCTION_PROJECT_REF` | Verified production project reference, used as a deny-match check |
| `BETA_STAGING_PROJECT_REF` | Different, verified staging project reference |
| `SUPABASE_URL` | Exact `https://<staging-ref>.supabase.co` |
| `BETA_STAGING_PUBLIC_KEY` | Staging publishable key or staging anon JWT; never a service key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging admin key, ONLY for account creation, not isolation checks |
| `BETA_OWNER_EMAIL` | Controlled test owner mailbox |
| `BETA_CUSTOMER_A_EMAIL`, `BETA_CUSTOMER_B_EMAIL` | Two other controlled mailboxes |
| `OWNER_EMAIL` | Exactly the test owner's email |
| `BETA_CUSTOMER_A_PASSWORD`, `BETA_CUSTOMER_B_PASSWORD` | Staging customer passwords established through protected recovery |

The project-reference guard depends on correct operator-supplied refs. It cannot cryptographically verify opaque keys belong to that project, prove a fresh schema is empty, or protect a dishonest/mistaken production-ref value. Verify backend identity independently before supplying admin credentials.

## Create fixtures (explicitly opt-in)

```sh
node --env-file=.env.staging.local scripts/staging/accounts.mjs check
# Add BETA_ALLOW_ACCOUNT_CREATE=yes in the protected env file only after checking identity.
node --env-file=.env.staging.local scripts/staging/accounts.mjs create
```

Creates one test-owner Auth user and two regular users. Owner app metadata is set ONLY inside the guarded staging target. Users are unconfirmed, with random passwords that are neither printed nor retained. Existing users are not overwritten; a duplicate/failure stops the run and earlier users may remain. Inspect staging Auth before rerunning. No automatic user deletion is supplied.

Set initial passwords via the staging application's password recovery flow and controlled mailbox; confirm emails as required. This is an acceptance step, not an assumption. The script creates users but does NOT send invitations, activate beta seats, migrate tables, set up SMTP, or create mailboxes. Verify `/beta` join/claim separately using those mailboxes and staging only.

## Contacts isolation smoke test (not comprehensive beta acceptance)

Remove the admin key from the runner's env file. Supply the two confirmed customer passwords securely, plus `BETA_ALLOW_TEST_WRITES=yes`:

```sh
node --env-file=.env.staging.local scripts/staging/isolation.mjs
```

Signs in customers A/B via public Auth, creates a synthetic contact for A, verifies A can read it, B cannot read/update it, and A's data is unchanged. Finally attempts to delete exactly that contact and signs out both clients. Cleanup failure is an error requiring staging inspection. Triggers may create derived rows; confirm cascade/cleanup behavior in the applied schema before repeated runs. No broad cleanup, arbitrary row deletion, real contact data or admin-key data access.

This tests only Auth plus the contacts table, not all permissions, files, delete/insert spoofing, or frontends. Continue with the human/automated acceptance matrix: owner password/magic link/expiry/sign-out; beta invite/recovery; onboarding persistence; files/storage RLS; CRM/tasks/calendar; campaigns/drafts; feedback owner visibility; all direct cross-account actions; then sandbox integrations. Do not call the entire backend tested after this smoke test.

## Local tooling verification

```sh
node --test tests/staging-guard.test.mjs
node --check scripts/staging/accounts.mjs
node --check scripts/staging/isolation.mjs
```

Guard tests run without a database. They verify rejection of same refs, conflicting URLs, production runtime, missing acknowledgement, duplicate mailboxes, wrong owner and admin keys in the customer runner. They do not establish working staging or real-account authentication.
