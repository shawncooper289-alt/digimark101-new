# DigiMark101 backend testing

The app has email/password account creation and sign-in at `/account`, private saved notes/drafts in Studio and Work Desks, and authenticated Grok planning at `/ava`. The Grok handler adapts the chat-completions integration from PR #60 to the current site. It verifies the Supabase access token server-side; a submitted user ID is not trusted. It uses a public Supabase key, never a service-role key, and keeps the xAI key on the server.

## Activate Supabase

1. In Supabase Project Settings → API, obtain the project URL and **publishable** key (or legacy `anon` key). Do not use a secret or service-role key.
2. In Vercel project Settings → Environment Variables, set `NEXT_PUBLIC_DIGIMARK_SUPABASE_URL` to the actual `https://<project>.supabase.co` URL and `NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY` to the actual public key, for Preview and Production. Encrypted configuration envelopes are not usable connection values. If an integration manages these values, repair/reconnect it rather than attempting to decode its encrypted payloads. Generic `NEXT_PUBLIC_SUPABASE_*` equivalents are supported when DigiMark-prefixed values are absent; invalid prefixed values must be corrected, not silently bypassed.
3. In Supabase SQL Editor, review and run `supabase/migrations/20261007_workspace.sql`. This workspace migration references `auth.users` directly and does not need the older scaffold schema. A Vercel deployment does **not** apply it.
4. In Supabase Authentication → Sign In / Providers, enable email/password. Under URL Configuration, set the Site URL to your intended site and allow the exact preview URL used for testing. Keep email confirmation enabled; confirm the email before signing in.
5. In Vercel, add server-only `XAI_API_KEY` for Preview and Production, optionally `XAI_MODEL` (default `grok-4.7`). Never prefix the xAI key with `NEXT_PUBLIC_`. Keys must be entered securely in the dashboard, not committed or pasted into chat.
6. Redeploy after configuration changes. Public Supabase values are included at build time.

## Test checklist

- Open `/account`, create a test account, confirm its email and sign in.
- Open `/studio`, create a note, reload and verify the note persists; delete it and reload.
- Repeat in Work Desks (Contacts, Pipeline, Funnels, YouTube and Pages store notes, not external integration actions).
- Create a second test account. Verify it cannot see or edit the first account's database rows. Sign-out/account changes refresh the workspace; signed-out local notes are browser-only and are not uploaded to an account.
- Open `/ava`, enter a marketing goal and ask Ava. Verify a real response. Missing configuration, expired sessions and upstream failures show errors instead of simulated success.
- Requests to `/api/ava/voice-chat` without a verified Supabase session must return 401, without calling xAI.

Run `node --test tests/ava-backend.test.cjs`, `npx tsc --noEmit`, and the targeted ESLint checks before release. Regression tests mock Supabase/xAI and do not establish live connectivity or database isolation.

## Limits

Database migration, real Auth, live Grok connectivity and RLS isolation still require the activation steps and real-account testing above. The planning API is a single-turn text endpoint, not phone/voice calling or durable conversation history. Subscription billing, seats, CRM integrations, YouTube publishing and media upload are not implemented. Do not treat suggestions or saved drafts as executed actions. Before opening registration broadly, add abuse controls and per-account AI usage limits.

Signed-out workspace items stay in localStorage in the current browser; shared-device users should export/delete them before leaving. Browser storage may be cleared; exports contain user-entered data.
