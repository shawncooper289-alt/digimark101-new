# avaskye.online — back office

Private, owner-only back office (Ava's desk) with no pricing pages. It manages campaigns (including DigiMark101) and product niches, and for digimark101.com and www.digimark101.com.
It shares the DigiMark101 Supabase project: same URL, keys, and migrations in `../supabase/migrations`. It reads and writes the same tables (leads, CRM, pipeline, automations, billing) with the service role key, after checking the signed-in user matches `OWNER_EMAIL`.

## Setup
1. `cd avaskye-online && npm install`
2. Copy `.env.example` to `.env.local` and use the **same values** as the main app.
3. `npm run dev`

## Deploy
Create a separate Vercel project with root directory `avaskye-online`, add the env vars, and attach the domain `avaskye.online`. To split into its own repo, copy this folder; it has no imports from the parent app.
