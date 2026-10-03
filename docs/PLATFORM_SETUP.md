# Ava platform setup

This build uses the `digimark101-new` repository. It preserves Ava's knowledge base from PR #10 and adds an authenticated workspace. This is an implementation build, not evidence that previously claimed Grok integrations were present.

## Required before customer launch

1. Vercel project **digimark101 → Settings → Environment Variables**: add `NEXT_PUBLIC_SUPABASE_URL` (an HTTPS Supabase project URL) and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the project's anon key). Use actual values, not encoded connection strings. Enable the same variables in Preview to test the preview. Never expose a service-role key in a `NEXT_PUBLIC_` variable.
2. In Supabase's SQL editor, review and run `supabase/migrations/20261003_workspace.sql`. This is separate from deploying the frontend; Vercel does not apply database migrations. The application uses the user's JWT and row-level security, not an admin key.
3. Enable email sign-in in Supabase Auth. Add the preview and eventual production URLs to its redirect allowlist/site configuration. Sign-in uses the email link, with email-code verification supported if your template includes a code.
4. AI Gateway routes the default `openai/gpt-4.1-mini` model to OpenAI. On Vercel it supports OIDC authentication; alternatively configure `AI_GATEWAY_API_KEY`. Ensure Gateway billing/credits and the chosen model are available. A direct OpenAI API key is not necessary for this implementation. Set `AVA_MODEL` to another Gateway model ID if needed.
5. Configure `PINECONE_API_KEY` and `PINECONE_INDEX_HOST` (HTTPS endpoint ending in `.pinecone.io`). The default `openai/text-embedding-3-small` requires a 1536-dimensional dense index. Original documents are held in Supabase; Pinecone stores only document IDs and vectors in a per-user namespace. If indexing fails, saving remains successful in Supabase and reports indexing pending. Re-save to retry; this currently creates another document, not an in-place retry. Chat falls back to the five newest Supabase documents when vector retrieval is unavailable.
6. Add `X_BEARER_TOKEN` for an X developer application with recent-search access. The integration is authenticated read-only topic research, not posting, OAuth account connection, or autonomous social management.
7. Set `PAYPAL_CHECKOUT_URL` to your approved HTTPS PayPal hosted checkout link. No prices are invented. This build redirects to that link; it does not implement order capture, verified webhooks, or automatic access/subscription provisioning. Those require a separate payment-lifecycle implementation before selling access to this workspace.
8. Upload your actual Ava walkthrough video and set `AVA_WALKTHROUGH_VIDEO_URL` to its HTTPS media URL. Replace `public/walkthrough.vtt` with synchronized captions. The current page honestly displays video pending rather than a fabricated video.
9. Redeploy after adding variables. Smoke-test sign-in, cross-user isolation, document save/indexing, chat, X search, and the hosted checkout flow. Calls and generated voice audio are not implemented; old scaffold routes now return unavailable rather than fake success.

## Architecture and security

- AI requests and private provider credentials stay server-side. Authenticated users can access only their own Supabase documents/messages; Pinecone namespaces derive from the verified user ID, never caller input.
- Built-in Ava expertise enters the server-side system prompt. Retrieved documents are treated as untrusted reference material. No model tools grant infrastructure, publishing, or payment privileges.
- Rate limiting, quotas, abuse monitoring, payment entitlement enforcement, account deletion and Pinecone lifecycle cleanup are required before a public paid launch. Email authentication alone is not an entitlement system.
- This agent's sandbox cannot reach deployment URLs or external integration services. A successful build/Ready deployment does not certify live provider calls.

## Checks

`npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm audit --omit=dev`.

AI Gateway documentation: https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc
