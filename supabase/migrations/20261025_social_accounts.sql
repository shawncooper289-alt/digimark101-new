alter table public.client_onboarding add column if not exists linkedin_url text;
alter table public.client_onboarding add column if not exists tiktok_url text;
alter table public.client_onboarding add column if not exists youtube_url text;
alter table public.client_onboarding add column if not exists x_url text;

-- Social connections. Tokens stay encrypted by the server before insert.
-- Members can read connection status, not the token columns.
-- Safe to re-run.

alter table public.platform_tokens drop constraint if exists platform_tokens_platform_check;
alter table public.platform_tokens
  add constraint platform_tokens_platform_check
  check (platform in ('facebook', 'instagram', 'google', 'website', 'linkedin', 'tiktok', 'x', 'youtube'));

drop policy if exists "Users can view their own tokens" on public.platform_tokens;
drop policy if exists "Users can insert their own tokens" on public.platform_tokens;
drop policy if exists "Users can update their own tokens" on public.platform_tokens;
drop policy if exists "Users can delete their own tokens" on public.platform_tokens;

revoke all on public.platform_tokens from anon, authenticated;
grant select, insert, update, delete on public.platform_tokens to service_role;

create or replace view public.social_account_status as
select
  user_id,
  platform,
  platform_account_name,
  platform_user_id,
  token_expires_at,
  scopes,
  updated_at,
  (access_token is not null and access_token <> '') as connected
from public.platform_tokens
where auth.uid() = user_id or public.is_owner();

revoke all on public.social_account_status from anon;
grant select on public.social_account_status to authenticated, service_role;

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube', 'google')),
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'cancelled')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scheduled_posts_user_idx on public.scheduled_posts (user_id, created_at desc);

alter table public.scheduled_posts enable row level security;

drop policy if exists scheduled_posts_access on public.scheduled_posts;
create policy scheduled_posts_access on public.scheduled_posts
  for all to authenticated
  using (public.is_owner() or auth.uid() = user_id)
  with check (public.is_owner() or auth.uid() = user_id);

revoke all on public.scheduled_posts from anon;
grant select, insert, update, delete on public.scheduled_posts to authenticated, service_role;
