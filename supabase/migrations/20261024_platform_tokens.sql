-- supabase/migrations/20261024_platform_tokens.sql
-- Secure token storage for connected social/business platforms

create table if not exists platform_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  platform text not null check (platform in ('facebook', 'instagram', 'google', 'website')),
  access_token text not null,
  refresh_token text,
  token_expires_at timestamp with time zone,
  scopes text,
  platform_user_id text,
  platform_account_name text,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, platform)
);

create index if not exists idx_platform_tokens_user_id on platform_tokens(user_id);
create index if not exists idx_platform_tokens_platform on platform_tokens(platform);

alter table platform_tokens enable row level security;

create policy "Users can view their own tokens"
  on platform_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
  on platform_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tokens"
  on platform_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
  on platform_tokens for delete
  using (auth.uid() = user_id);

create or replace function update_platform_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_platform_tokens_updated_at
  before update on platform_tokens
  for each row execute function update_platform_tokens_updated_at();