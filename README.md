# DigiMark101

Marketing site for [DigiMark101](https://www.digimark101.com), a digital marketing studio. The public site covers services, placeholder work structures, packages, the studio, a journal, contact, and legal pages. Ava Skye is the on-site assistant.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The site builds and serves without any API keys. Ava answers from a studio guide until a model key is set, and she can still create preview contacts, book times, and fill forms. The contact form explains that a note was not stored until Supabase is configured, and offers an email draft to hello@digimark101.com.

The studio lives at `/studio`. Without Supabase it is a browser preview. With Supabase Auth and `supabase/migrations/20261015_platform.sql`, each login is a private workspace. See [docs/PLATFORM.md](docs/PLATFORM.md) for what is included and what is still ahead.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Where to edit

- Public copy, packages, journal, and the studio email: `lib/site.ts`
- Membership prices: `lib/paypal/membership.json`
- Ava's rules and provider order: `lib/ava/respond.ts`
- Lead storage: `lib/leads.ts` and `supabase/migrations/20261015_leads.sql`

Do not add client names or performance numbers unless a partner has approved them. The work pages are labeled placeholders on purpose.

## Environment

Copy `.env.example`. Ava uses the first configured provider:

1. `AVA_LLM_API_KEY` with optional `AVA_LLM_BASE_URL` and `AVA_LLM_MODEL` (any OpenAI-compatible API)
2. `XAI_API_KEY` with optional `XAI_MODEL` (default `grok-4.7`, endpoint `https://api.x.ai/v1`)
3. `OPENAI_API_KEY` with optional `OPENAI_MODEL` (default `gpt-4o-mini`)

Leads need `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL` / `NEXT_PUBLIC_DIGIMARK_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`. The service role key is server-only.

The studio needs the same URL plus `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon key, not the service role). Chat voice uses the browser Web Speech API. `AVA_TTS_API_KEY` is optional and only affects the homepage introduction.

Membership checkout needs the PayPal variables in `.env.example`. Until they are set, the pricing page lists the prices and says checkout is coming soon. The webhook also needs `SUPABASE_SERVICE_ROLE_KEY` so it can write `public.subscriptions`.

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md) for Vercel, the domain, and the reason www.digimark101.com currently returns Vercel's `DEPLOYMENT_NOT_FOUND`.

Local setup notes are in [docs/QUICK_START.md](docs/QUICK_START.md).
