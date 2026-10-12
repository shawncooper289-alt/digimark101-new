# Deploy

Use [workspace setup](./WORKSPACE_SETUP.md) to activate and test account sign-in, private storage and Ava's Grok backend.

1. Import the repository in Vercel using the Next.js preset and repository root.
2. Set valid Supabase public URL/key and server-only `XAI_API_KEY` for the intended environments; optionally set `XAI_MODEL`.
3. Review/apply the workspace migration in Supabase SQL Editor and configure email/password Auth and allowed URLs.
4. Deploy a preview, run the two-account isolation and Ava tests, then release to production.

Do not commit environment files or expose xAI/service-role keys in public variables. Deployment alone does not migrate Supabase or verify external connectivity.
