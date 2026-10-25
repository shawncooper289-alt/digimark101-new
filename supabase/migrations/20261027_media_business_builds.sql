-- Studio Media Library, Business Setup, and Builds.
-- Safe to re-run. Every table is private to its user through row-level security.

alter table public.client_onboarding
  add column if not exists legal_name text,
  add column if not exists dba_name text,
  add column if not exists business_type text,
  add column if not exists ein text,
  add column if not exists linkedin_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text,
  add column if not exists x_url text,
  add column if not exists privacy_url text,
  add column if not exists terms_url text;

create table if not exists public.client_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  media_type text not null default 'image',
  url text,
  storage_path text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  media_id uuid not null references public.client_media (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, media_id)
);

create table if not exists public.client_build_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_type text not null default 'website',
  name text not null,
  holding_url text,
  final_url text,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array['client_media', 'campaign_media', 'client_build_assets']
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I_own on public.%I', tbl, tbl);
    execute format(
      'create policy %I_own on public.%I for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl, tbl
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
    execute format('create index if not exists %I on public.%I (user_id)', tbl || '_user_idx', tbl);
  end loop;
end $$;
