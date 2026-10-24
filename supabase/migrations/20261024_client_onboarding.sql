-- supabase/migrations/20261024_client_onboarding.sql
-- First-time setup wizard table for DigiMark101 clients

create table if not exists client_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  client_name text,
  personal_email text,
  business_email text,
  business_name text,
  personal_phone text,
  business_phone text,
  business_address text,
  business_website text,
  facebook_url text,
  instagram_url text,
  google_business_url text,
  onboarding_complete boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for common lookups
create index if not exists idx_client_onboarding_user_id on client_onboarding(user_id);
create index if not exists idx_client_onboarding_business_email on client_onboarding(business_email);

-- RLS
alter table client_onboarding enable row level security;

create policy "Users can view their own onboarding"
  on client_onboarding for select
  using (auth.uid() = user_id);

create policy "Users can insert their own onboarding"
  on client_onboarding for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own onboarding"
  on client_onboarding for update
  using (auth.uid() = user_id);

-- Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_client_onboarding_updated_at
  before update on client_onboarding
  for each row execute function update_updated_at_column();