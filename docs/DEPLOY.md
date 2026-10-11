# Deploy

## Vercel

1. Import this GitHub repository in Vercel.
2. Add `XAI_API_KEY` and, optionally, `XAI_MODEL` as server-side environment variables. Do not expose the API key with a `NEXT_PUBLIC_` prefix.
3. Deploy to production.

## Supabase

1. Create a Supabase project.
2. Run SQL migration at `supabase/migrations/initial_schema.sql`.
3. Set auth redirect URLs to your Vercel domain.
