# Deploy

## Vercel

1. Import this GitHub repository in Vercel.
2. Add environment variables from `.env.local`.
3. Deploy to production.

## Supabase

1. Create a Supabase project.
2. Run SQL migration at `supabase/migrations/initial_schema.sql`.
3. Set auth redirect URLs to your Vercel domain.
