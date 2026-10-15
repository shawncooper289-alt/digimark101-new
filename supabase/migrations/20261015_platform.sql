-- Per-client workspace. Every row is owned by auth.uid().
-- Row level security is the boundary: a signed-in client cannot read or write another client's rows.
-- The service role is not used by the studio API.

create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  contact_name text not null default '',
  stage text not null default 'new' check (stage in ('new', 'qualified', 'proposal', 'won', 'lost')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  contact_name text not null default '',
  starts_at timestamptz not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_name text not null default '',
  subject text not null default 'Note',
  created_at timestamptz not null default now()
);

create table if not exists public.thread_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  thread_id uuid not null references public.threads (id) on delete cascade,
  body text not null,
  sender text not null default 'studio' check (sender in ('client', 'studio')),
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  channel text not null default 'email',
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  brief text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  path text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  headline text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  trigger_key text not null check (trigger_key in ('contact.created', 'appointment.booked', 'deal.moved')),
  action_key text not null check (action_key in ('log_inbox', 'remember')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.client_memory (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  memory_key text not null,
  memory_value text not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, memory_key)
);

create table if not exists public.client_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  path text not null,
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.appointments enable row level security;
alter table public.threads enable row level security;
alter table public.thread_messages enable row level security;
alter table public.campaigns enable row level security;
alter table public.sites enable row level security;
alter table public.automations enable row level security;
alter table public.client_memory enable row level security;
alter table public.client_files enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts', 'deals', 'appointments', 'threads', 'thread_messages',
    'campaigns', 'sites', 'automations', 'client_memory', 'client_files'
  ]
  loop
    execute format('drop policy if exists %I_own on public.%I', tbl, tbl);
    execute format(
      'create policy %I_own on public.%I for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id)',
      tbl, tbl
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
  end loop;
end $$;

create index if not exists contacts_owner_idx on public.contacts (owner_id);
create index if not exists deals_owner_idx on public.deals (owner_id);
create index if not exists appointments_owner_idx on public.appointments (owner_id);
create index if not exists threads_owner_idx on public.threads (owner_id);
create index if not exists thread_messages_owner_idx on public.thread_messages (owner_id);
create index if not exists campaigns_owner_idx on public.campaigns (owner_id);
create index if not exists sites_owner_idx on public.sites (owner_id);
create index if not exists automations_owner_idx on public.automations (owner_id);
create index if not exists client_memory_owner_idx on public.client_memory (owner_id);
create index if not exists client_files_owner_idx on public.client_files (owner_id);

insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

drop policy if exists client_files_read on storage.objects;
drop policy if exists client_files_write on storage.objects;
drop policy if exists client_files_update on storage.objects;
drop policy if exists client_files_delete on storage.objects;

create policy client_files_read on storage.objects
  for select to authenticated
  using (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy client_files_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy client_files_update on storage.objects
  for update to authenticated
  using (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy client_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'client-files' and (storage.foldername(name))[1] = auth.uid()::text);
