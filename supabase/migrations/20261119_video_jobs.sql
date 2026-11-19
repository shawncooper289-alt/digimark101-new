-- Private film jobs for the studio and the owner office.
-- Apply this in the Supabase SQL editor. The app does not apply it.
-- The Free plan still rejects any one file over 50 MB. A 3.5 minute 1080p film
-- needs the Pro plan before the master file can be stored.

create table if not exists public.video_jobs (
  id text primary key,
  owner_id uuid,
  app text not null default 'studio' check (app in ('studio', 'office')),
  stage text not null default 'script',
  title text not null default '',
  brief jsonb not null default '{}'::jsonb,
  project jsonb,
  shots jsonb not null default '[]'::jsonb,
  words jsonb not null default '[]'::jsonb,
  voice_url text not null default '',
  music_url text not null default '',
  master_url text not null default '',
  composition jsonb,
  picture jsonb,
  quality jsonb,
  cost jsonb,
  note text not null default '',
  reasons jsonb not null default '[]'::jsonb,
  attempt integer not null default 1,
  assets jsonb not null default '[]'::jsonb,
  locked_by text not null default '',
  locked_until timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_shots (
  id text primary key,
  job_id text not null references public.video_jobs (id) on delete cascade,
  index integer not null default 0,
  role text not null default 'talking',
  spoken text not null default '',
  caption text not null default '',
  visual text not null default '',
  status text not null default 'pending',
  provider text not null default '',
  provider_id text not null default '',
  output_url text not null default '',
  audio_url text not null default '',
  error text not null default '',
  start_ms integer not null default 0,
  end_ms integer not null default 0
);

create table if not exists public.video_assets (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.video_jobs (id) on delete cascade,
  kind text not null default 'file',
  storage_path text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists video_jobs_updated_idx on public.video_jobs (updated_at desc);
create index if not exists video_jobs_stage_idx on public.video_jobs (stage, updated_at);
create index if not exists video_jobs_owner_idx on public.video_jobs (owner_id);
create index if not exists video_shots_job_idx on public.video_shots (job_id, index);
create index if not exists video_assets_job_idx on public.video_assets (job_id);

alter table public.video_jobs enable row level security;
alter table public.video_shots enable row level security;
alter table public.video_assets enable row level security;

-- Signed-in people may read their own rows. They may not write them.
-- The site writes with the service role. A member update could otherwise
-- point a status check at another server, or ask the site to sign someone else's file.

drop policy if exists video_jobs_owner on public.video_jobs;
drop policy if exists video_jobs_read on public.video_jobs;
create policy video_jobs_read on public.video_jobs
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_owner());

drop policy if exists video_shots_owner on public.video_shots;
drop policy if exists video_shots_read on public.video_shots;
create policy video_shots_read on public.video_shots
  for select to authenticated
  using (
    exists (
      select 1 from public.video_jobs
      where video_jobs.id = video_shots.job_id
        and (video_jobs.owner_id = (select auth.uid()) or public.is_owner())
    )
  );

drop policy if exists video_assets_owner on public.video_assets;
drop policy if exists video_assets_read on public.video_assets;
create policy video_assets_read on public.video_assets
  for select to authenticated
  using (
    exists (
      select 1 from public.video_jobs
      where video_jobs.id = video_assets.job_id
        and (video_jobs.owner_id = (select auth.uid()) or public.is_owner())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000,
  array['video/mp4', 'audio/mpeg', 'audio/wav', 'text/vtt', 'application/json', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists videos_read on storage.objects;
create policy videos_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'videos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_owner()
    )
  );
