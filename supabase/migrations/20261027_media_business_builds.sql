-- Studio Media, Business, and Builds.
-- Checked against the hosted project (information_schema) and against the app.
-- The live tables already use owner_id / kind / public_url / description,
-- campaign_media (campaign_id, media_id, position), and client_build_assets.title.
-- This file creates that shape on a fresh database and only adds missing columns
-- on a database that already has it. Safe to re-run.
--
-- client_onboarding stays user-scoped (no owner read). EIN-style fields use the
-- live names: legal_business_name, ein_tax_id, privacy_policy_url.

alter table public.client_onboarding
  add column if not exists legal_business_name text,
  add column if not exists dba_name text,
  add column if not exists business_type text,
  add column if not exists ein_tax_id text,
  add column if not exists privacy_policy_url text,
  add column if not exists terms_url text,
  add column if not exists linkedin_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text,
  add column if not exists x_url text;

create table if not exists public.client_media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  kind text not null default 'image',
  title text not null,
  description text not null default '',
  storage_path text not null default '',
  public_url text,
  mime_type text,
  size_bytes bigint,
  tags text[] not null default '{}',
  reusable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_media_kind_check check (kind in ('image', 'video', 'document', 'copy', 'creative', 'other'))
);

alter table public.client_media add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.client_media add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.client_media add column if not exists kind text default 'image';
alter table public.client_media add column if not exists title text;
alter table public.client_media add column if not exists description text default '';
alter table public.client_media add column if not exists storage_path text default '';
alter table public.client_media add column if not exists public_url text;
alter table public.client_media add column if not exists mime_type text;
alter table public.client_media add column if not exists size_bytes bigint;
alter table public.client_media add column if not exists tags text[] default '{}';
alter table public.client_media add column if not exists reusable boolean default true;
alter table public.client_media add column if not exists created_at timestamptz default now();
alter table public.client_media add column if not exists updated_at timestamptz default now();

create table if not exists public.campaign_media (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  media_id uuid not null references public.client_media (id) on delete cascade,
  position integer not null default 0,
  primary key (campaign_id, media_id)
);

alter table public.campaign_media add column if not exists campaign_id uuid references public.campaigns (id) on delete cascade;
alter table public.campaign_media add column if not exists media_id uuid references public.client_media (id) on delete cascade;
alter table public.campaign_media add column if not exists position integer default 0;

create table if not exists public.client_build_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  asset_type text not null default 'website',
  title text not null,
  holding_url text,
  final_url text,
  storage_path text,
  status text not null default 'holding',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_build_assets_asset_type_check check (asset_type in ('website', 'landing_page', 'banner', 'ad_creative', 'email_template', 'social_graphic', 'video', 'other')),
  constraint client_build_assets_status_check check (status in ('holding', 'review', 'approved', 'live', 'archived'))
);

alter table public.client_build_assets add column if not exists owner_id uuid references auth.users (id) on delete cascade;
alter table public.client_build_assets add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.client_build_assets add column if not exists asset_type text default 'website';
alter table public.client_build_assets add column if not exists title text;
alter table public.client_build_assets add column if not exists holding_url text;
alter table public.client_build_assets add column if not exists final_url text;
alter table public.client_build_assets add column if not exists storage_path text;
alter table public.client_build_assets add column if not exists status text default 'holding';
alter table public.client_build_assets add column if not exists notes text default '';
alter table public.client_build_assets add column if not exists created_at timestamptz default now();
alter table public.client_build_assets add column if not exists updated_at timestamptz default now();

-- A draft of this file used user_id, media_type, url, notes, and name.
-- Copy those into the live columns once, then stop requiring them.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_media' and column_name = 'user_id'
  ) then
    update public.client_media
    set owner_id = user_id
    where owner_id is null and user_id is not null;
    alter table public.client_media alter column user_id drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_media' and column_name = 'media_type'
  ) then
    update public.client_media
    set kind = case
      when media_type in ('image', 'video', 'document', 'copy', 'creative', 'other') then media_type
      when media_type = 'logo' then 'creative'
      else 'other'
    end
    where kind is null or kind = '';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_media' and column_name = 'url'
  ) then
    update public.client_media set public_url = url where public_url is null and url is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_media' and column_name = 'notes'
  ) then
    update public.client_media
    set description = notes
    where (description is null or description = '') and notes is not null;
  end if;

  update public.client_media set storage_path = '' where storage_path is null;
  update public.client_media set description = '' where description is null;
  update public.client_media set kind = 'image' where kind is null or kind = '';
  update public.client_media set tags = '{}' where tags is null;
  update public.client_media set reusable = true where reusable is null;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_build_assets' and column_name = 'user_id'
  ) then
    update public.client_build_assets
    set owner_id = user_id
    where owner_id is null and user_id is not null;
    alter table public.client_build_assets alter column user_id drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'client_build_assets' and column_name = 'name'
  ) then
    update public.client_build_assets set title = name where (title is null or title = '') and name is not null;
  end if;

  update public.client_build_assets set status = 'holding' where status is null or status = '' or status = 'planned';
  update public.client_build_assets set notes = '' where notes is null;
  update public.client_build_assets set asset_type = 'other' where asset_type is null or asset_type = '';

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'campaign_media' and column_name = 'user_id'
  ) then
    alter table public.campaign_media alter column user_id drop not null;
  end if;
end $$;

alter table public.client_media alter column storage_path set default '';
alter table public.client_media alter column storage_path set not null;
alter table public.client_media alter column description set default '';
alter table public.client_media alter column description set not null;
alter table public.client_media alter column kind set default 'image';
alter table public.client_media alter column kind set not null;
alter table public.client_build_assets alter column status set default 'holding';
alter table public.client_build_assets alter column notes set default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_media'::regclass and conname = 'client_media_kind_check'
  ) then
    alter table public.client_media
      add constraint client_media_kind_check
      check (kind in ('image', 'video', 'document', 'copy', 'creative', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_media'::regclass and contype = 'p'
  ) then
    alter table public.campaign_media add primary key (campaign_id, media_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_media'::regclass and conname = 'campaign_media_campaign_id_media_id_key'
  ) and not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaign_media'::regclass and contype = 'p'
  ) then
    alter table public.campaign_media add unique (campaign_id, media_id);
  end if;

  alter table public.client_build_assets drop constraint if exists client_build_assets_status_check;
  alter table public.client_build_assets
    add constraint client_build_assets_status_check
    check (status in ('holding', 'review', 'approved', 'live', 'archived'));

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.client_build_assets'::regclass and conname = 'client_build_assets_asset_type_check'
  ) then
    alter table public.client_build_assets
      add constraint client_build_assets_asset_type_check
      check (asset_type in ('website', 'landing_page', 'banner', 'ad_creative', 'email_template', 'social_graphic', 'video', 'other'));
  end if;
end $$;

create index if not exists client_media_owner_idx on public.client_media (owner_id, created_at desc);
create index if not exists client_build_assets_owner_idx on public.client_build_assets (owner_id, created_at desc);
create index if not exists campaign_media_media_idx on public.campaign_media (media_id);

alter table public.client_media enable row level security;
alter table public.campaign_media enable row level security;
alter table public.client_build_assets enable row level security;

drop policy if exists client_media_own on public.client_media;
drop policy if exists client_media_access on public.client_media;
create policy client_media_access on public.client_media
  for all to authenticated
  using (public.can_access_workspace(workspace_id, owner_id))
  with check (public.can_access_workspace(workspace_id, owner_id));

drop policy if exists campaign_media_own on public.campaign_media;
drop policy if exists campaign_media_access on public.campaign_media;
create policy campaign_media_access on public.campaign_media
  for all to authenticated
  using (
    public.is_owner()
    or exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.can_access_workspace(c.workspace_id, c.owner_id)
    )
  )
  with check (
    public.is_owner()
    or exists (
      select 1 from public.campaigns c
      where c.id = campaign_id
        and public.can_access_workspace(c.workspace_id, c.owner_id)
    )
  );

drop policy if exists client_build_assets_own on public.client_build_assets;
drop policy if exists client_build_assets_access on public.client_build_assets;
create policy client_build_assets_access on public.client_build_assets
  for all to authenticated
  using (public.can_access_workspace(workspace_id, owner_id))
  with check (public.can_access_workspace(workspace_id, owner_id));

revoke all on public.client_media from anon;
revoke all on public.campaign_media from anon;
revoke all on public.client_build_assets from anon;
grant select, insert, update, delete on public.client_media to authenticated, service_role;
grant select, insert, update, delete on public.campaign_media to authenticated, service_role;
grant select, insert, update, delete on public.client_build_assets to authenticated, service_role;
