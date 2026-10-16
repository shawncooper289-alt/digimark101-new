# Deploy DigiMark101

Production domain: **https://www.digimark101.com**

The site is a Next.js App Router app at the **repository root**. Vercel should use:

- Framework preset: Next.js
- Root directory: `.` (the repository root, not a nested folder)
- Production branch: `main`
- Build command: `npm run build`
- Install command: `npm install`
- Output: leave the default (do not set a custom output directory)

## Why the domain returns 404 right now

Requesting `https://www.digimark101.com` and `https://digimark101.com` returns Vercel's platform error, not a Next.js page:

```text
HTTP/2 404
server: Vercel
x-vercel-error: DEPLOYMENT_NOT_FOUND

The deployment could not be found on Vercel.
```

`next.config.ts` is not the cause. An empty config still builds a normal Next.js app, and this repository's root has `app/page.tsx`. `DEPLOYMENT_NOT_FOUND` means the hostname reaches Vercel, but no deployment is attached to it. A preview that was aliased to the domain disappears when that deployment is deleted, the project is removed, or the team can no longer serve it.

GitHub deployment statuses on this repo show two Vercel projects:

| When | Project | Result |
| --- | --- | --- |
| 2026-09-30 and 2026-10-12 | `ava-skye-os/digimark101-new` | Failed. The status text was **"Account is blocked."** See [Vercel's blocked-account note](https://vercel.com/knowledge/why-is-my-account-deployment-blocked). |
| 2026-10-03 | `shawncooper289-alts-projects/digimark101` | Deployment of `main` completed. |
| 2026-10-12 | `shawncooper289-alts-projects/digimark101.com` | Production deployment **completed** for commit `e39d1ea` on branch `vercel-agent/grok-complete-build`, not `main`. |

That October 12 production deployment is the last one GitHub recorded for the `digimark101.com` project. It is no longer being served. Nothing in the current `main` history from the last day deleted it; the alias is simply pointing at a deployment Vercel can no longer find.

Before the next deploy will stick:

1. Open the Vercel team that should own the domain and confirm the account is not blocked and billing is active. A blocked team will reject new deployments even when the build is fine.
2. Pick **one** project for this repository. If an old project used Root Directory `avaskye-online`, change it to the repository root. That folder existed only on `vercel-agent/grok-complete-build` and is not part of this site.
3. Set the production branch to `main` after this change is merged.

## Deploy on Vercel

1. Merge this branch to `main`.
2. In Vercel, open the chosen project (or import `shawncooper289-alt/DigiMark101-new` if the project was deleted: **Add New → Project → Import** this Git repository).
3. Confirm the settings in the table at the top of this file. Do not override the build unless you have a reason.
4. Add the environment variables below for **Production**, **Preview**, and **Development**.
5. Deploy. The first successful production deployment creates a `*.vercel.app` URL. Open `/` there before attaching the domain. You should see the DigiMark101 homepage, not a Vercel platform 404.
6. In the project, go to **Settings → Domains** and add both:
   - `www.digimark101.com`
   - `digimark101.com`
7. Set `www.digimark101.com` as the primary domain and redirect the apex to it. The site's canonical URL is `https://www.digimark101.com`.
8. If the domain already uses Vercel nameservers, Vercel updates DNS for you. If DNS is hosted elsewhere, create:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` record for `www` → `cname.vercel-dns.com`
9. Remove the domain from every other Vercel project so only one project answers for it. Two projects claiming the same hostname is a common way to end up with `DEPLOYMENT_NOT_FOUND`.
10. After DNS shows **Valid Configuration**, open `https://www.digimark101.com` in a private window. A hard refresh is enough; the old 404 is not cached as an application page.

Redeploy production from the Vercel **Deployments** tab any time you need a clean production deployment of `main` (`Redeploy` → include the latest commit, production environment).

## Studio platform

This deploy also serves `/studio`, the signed-in workspace. Run `supabase/migrations/20261015_platform.sql` before you expect contacts, memory, or file uploads to save. Each table is protected by row-level security on `auth.uid()`. Details, the voice behavior, and the phases that are not built yet are in [PLATFORM.md](./PLATFORM.md).

## Environment variables

Copy from `.env.example`. Set them in **Project → Settings → Environment Variables**. Server secrets must not use the `NEXT_PUBLIC_` prefix.

### Required to go live as a brochure site

None. The marketing pages, guide-mode Ava, sitemap, and robots file build without secrets. The contact form will not store notes until Supabase is connected, and it says so.

### Ava Skye (one provider)

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `XAI_API_KEY` | [xAI console](https://console.x.ai/) | Preferred if you already used Grok. Calls `https://api.x.ai/v1/chat/completions`. |
| `XAI_MODEL` | same | Optional. Defaults to `grok-4.7`. Set this if your account uses a different model name. |
| `OPENAI_API_KEY` | [OpenAI API keys](https://platform.openai.com/api-keys) | Used when `XAI_API_KEY` and `AVA_LLM_API_KEY` are unset. |
| `OPENAI_MODEL` | same | Optional. Defaults to `gpt-4o-mini`. |
| `AVA_LLM_API_KEY` | your provider | If set, this wins over the xAI and OpenAI keys. |
| `AVA_LLM_BASE_URL` | your provider | Optional OpenAI-compatible base URL. Defaults to `https://api.openai.com/v1`. |
| `AVA_LLM_MODEL` | your provider | Optional. Defaults to `gpt-4o-mini`. |

Provider order in code: `AVA_LLM_API_KEY`, then `XAI_API_KEY`, then `OPENAI_API_KEY`, then the studio guide. If the live call fails, Ava still answers from the guide and the widget says the model did not respond.

Voice input and spoken replies use the browser Web Speech API. They do not need a key. Phone calling is not connected.

### Leads

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Also used for sign-in. `NEXT_PUBLIC_DIGIMARK_SUPABASE_URL` is an accepted alias. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon or publishable key | Required for the studio. The browser uses it with the user's session so row-level security applies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | Server-only, public lead form only. Do not use it for studio data. It bypasses row-level security. |

The anon / publishable key is not used for lead inserts. Do not rely on it for the form.

### PayPal membership

Three auto-renewing USD plans. Change the amounts in `lib/paypal/membership.json` only. The pricing page reads that file. Current placeholder base:

| Term | Charge | Savings |
| --- | --- | --- |
| Monthly | $497 every 1 month | Base price |
| Quarterly | $1,312 every 3 months | About 12% off |
| Semiannual | $2,326 every 6 months | About 22% off |

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Developer → Apps & Credentials → Client ID | Public. The pricing page loads `https://www.paypal.com/sdk/js` (or the sandbox host) with `vault=true&intent=subscription`. |
| `NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY` | Plan id from the script or the PayPal dashboard | Monthly plan. |
| `NEXT_PUBLIC_PAYPAL_PLAN_QUARTERLY` | same | Quarterly plan. |
| `NEXT_PUBLIC_PAYPAL_PLAN_SEMIANNUAL` | same | Semiannual plan. |
| `PAYPAL_ENV` | `sandbox` or `live` | Defaults to `sandbox` when unset. Live buttons and live webhook checks require `live`. |
| `PAYPAL_CLIENT_ID` | Same app's client id | Server-only. Webhook verification and `scripts/paypal-create-plans.mjs`. |
| `PAYPAL_CLIENT_SECRET` | Same app's secret | Server-only. Never use a `NEXT_PUBLIC_` name. |
| `PAYPAL_WEBHOOK_ID` | PayPal app → Webhooks → Webhook ID | Server-only. The route rejects events it cannot verify. |

With the public client id or a plan id unset, that checkout shows **Membership checkout is coming soon** and still lists the prices.

Setup:

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications), create a REST app. Use the sandbox app until you are ready to charge real accounts, then the live app.
2. In the Supabase SQL editor, run `supabase/migrations/20261016_subscriptions.sql`. It creates `public.subscriptions` with row-level security: a signed-in user can read only a row whose `owner_id` is `auth.uid()`. The webhook writes with the service role.
3. From the repo root, create the product and plans. The script reads `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_ENV` from the environment or from `.env.local`:

```bash
PAYPAL_ENV=sandbox PAYPAL_CLIENT_ID=YOUR_CLIENT_ID PAYPAL_CLIENT_SECRET=YOUR_SECRET node scripts/paypal-create-plans.mjs
```

It creates the product **DigiMark101 Membership** and prints three ids:

```text
NEXT_PUBLIC_PAYPAL_PLAN_MONTHLY=P-...
NEXT_PUBLIC_PAYPAL_PLAN_QUARTERLY=P-...
NEXT_PUBLIC_PAYPAL_PLAN_SEMIANNUAL=P-...
```

4. Put those ids, plus `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (the same client id), into Vercel. Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` for the server.
5. In that PayPal app, add a webhook pointing at `https://www.digimark101.com/api/webhooks/paypal`. Subscribe it to these events only:

- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `PAYMENT.SALE.COMPLETED`

6. Copy the webhook id into `PAYPAL_WEBHOOK_ID` and redeploy.
7. Open `/pricing`. Sandbox mode shows a sandbox notice on the button. A buyer who is signed in has their user id sent as PayPal `custom_id`, and the webhook stores `owner_id` when that value is a user id. `/thank-you` and `/cancel` are the return pages.
8. For production, repeat steps 3–6 with `PAYPAL_ENV=live` and the live app. Sandbox plan ids do not work on live.

PayPal does not change an existing subscriber when you edit the JSON. After a price change, run the script again and point the env vars at the new plan ids.

`SUPABASE_SERVICE_ROLE_KEY` is required for the webhook to upsert `public.subscriptions`. It is the same server-only key as the lead form. Do not use it in the browser.

### Site URL

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.digimark101.com` |

Used for canonical URLs, the sitemap, and structured data. If unset, the code already defaults to that host.

## Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/initial_schema.sql` if you also want the older Ava profile tables. Those tables are for a future signed-in product. The marketing site does not require them.
3. Run `supabase/migrations/20261015_leads.sql`. It creates `public.leads` and enables row level security with no public policies. The service role key is what inserts rows.
4. Add the two lead variables in Vercel and redeploy.
5. Submit the contact form on the production URL and confirm a row in `public.leads`.

Auth redirect URLs are not required for this marketing site. Add `https://www.digimark101.com` later if you turn on Supabase Auth.

## After launch

- Change the public email in `lib/site.ts` if `hello@digimark101.com` is not the mailbox you will read.
- Add a package fee in `lib/site.ts` (`priceLabel` on each package) only when you want one published. Until then Field, Studio, and Partner stay quoted in a proposal. Membership prices are the separate public rates in `lib/paypal/membership.json`.
- Replace a work page only with a client name and numbers that partner has approved.
