-- DigiMark101 consolidated schema.
-- Paste this entire file into the Supabase SQL editor on an empty project database
-- (auth and storage schemas already present, as they are on every Supabase project).
-- It concatenates every file in supabase/migrations in filename order, which is also
-- the order these migrations were written. Do not run it on a database that already
-- applied these migrations.
--
-- Ordering notes (single run on an empty Supabase database):
-- 1. initial_schema.sql sorts last. Its policies call public.is_owner(), which
--    20261017_managed_backends.sql creates and 20261017_owner_role.sql replaces.
--    Moving initial_schema.sql ahead of those files fails with
--    "function public.is_owner() does not exist". Filename order avoids that.
--    20261017_owner_role.sql alters public.profiles only when that table already
--    exists, so profiles being created later in initial_schema.sql is safe.
-- 2. 20261019_product_hub.sql alters public.office_records. That table is created
--    by 20261019_office_records.sql, which sorts first. Swapping those two files fails.
-- 3. 20261026_client_onboarding_user_id_unique.sql dedupes client_onboarding.user_id
--    and adds a unique index. It must stay after 20261024_client_onboarding.sql.
-- 4. 20261007_workspace.sql calls gen_random_uuid() before 20261015_leads.sql
--    creates pgcrypto. Supabase Postgres provides gen_random_uuid() in core, so an
--    empty Supabase database succeeds. A Postgres build without that function fails
--    on the first file until pgcrypto exists.
-- 5. These CREATE POLICY and CREATE TRIGGER statements have no DROP IF EXISTS, so
--    they succeed once on an empty database and fail if this file is pasted again:
--    20261024_client_onboarding.sql (three policies and update_client_onboarding_updated_at)
--    and 20261024_platform_tokens.sql (four policies and update_platform_tokens_updated_at).
--    Other policies and triggers in this file drop the previous object first, or are created once.
-- 6. References to auth.users and storage.objects assume a Supabase project. They are
--    not created by this file. A bare Postgres database without those schemas fails there.
-- No statements were rewritten. Filename order does not reference a table that a later
-- file creates, except the guarded profiles alter described above.

-- ===== 20261007_workspace.sql =====

-- Apply through your connected Supabase project's SQL Editor.
create table if not exists public.digimark_workspace (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('Studio','Contacts','Pipeline','Funnels','YouTube','Pages')),
 title text not null check (char_length(title) between 1 and 200),
 content text not null check (char_length(content) between 1 and 20000),
 created_at timestamptz not null default now()
);
alter table public.digimark_workspace enable row level security;
drop policy if exists "workspace_owner" on public.digimark_workspace;
create policy "workspace_owner" on public.digimark_workspace for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.digimark_workspace to authenticated;
revoke all on public.digimark_workspace from anon;
create index if not exists workspace_owner_kind on public.digimark_workspace(user_id,kind,created_at desc);

-- ===== 20261015_leads.sql =====

-- Public project notes from the marketing site.
-- Inserts are made with the service role key, which bypasses row level security.
-- There is no anon insert policy on purpose.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  website text,
  service text,
  budget text,
  message text not null,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ===== 20261015_platform.sql =====

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

-- ===== 20261016_subscriptions.sql =====

-- PayPal memberships. The webhook writes with the service role, which bypasses row level security.
-- A signed-in client can read only the row linked to auth.uid(). Other clients cannot see it.
-- owner_id stays null until checkout included that user's id.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  paypal_subscription_id text not null unique,
  paypal_plan_id text,
  plan_key text,
  status text not null,
  payer_email text,
  payer_id text,
  currency text not null default 'USD',
  amount_value numeric(12, 2),
  interval_count integer,
  last_payment_amount numeric(12, 2),
  last_payment_at timestamptz,
  next_billing_time timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  last_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = owner_id);

revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;

create index if not exists subscriptions_owner_idx on public.subscriptions (owner_id);

-- ===== 20261017_leads_engine.sql =====

-- Lead engine.
-- lead_records is the store: premium, consented, not opted out, not suppressed.
-- lead_staging holds everything still being qualified. lead_rejected holds
-- rows that failed consent, opt-out, or deletion. Both are hidden.
-- Personal details live only in lead_private_contacts. That table has row
-- level security, no policies for anon or authenticated, and those roles
-- are revoked. Only the service role (Ava's server key) can read it.
-- The owner account reaches counts through the app, which checks
-- LEAD_OWNER_USER_ID and then uses the service role. Buyers never get a
-- policy on the private table. Full contact details are returned by the
-- server only after a paid order.

create extension if not exists "pgcrypto";

create table if not exists public.lead_staging (
  id uuid primary key default gen_random_uuid(),
  niche text not null default 'general',
  region text not null default 'unspecified',
  company_size text not null default 'unspecified',
  score integer not null default 0,
  source_kind text not null check (source_kind in ('form', 'csv', 'api', 'ava', 'connector')),
  connector_id text,
  consent_contact boolean not null default false,
  consent_share boolean not null default false,
  consent_at timestamptz,
  has_company boolean not null default false,
  has_website boolean not null default false,
  message_chars integer not null default 0,
  enriched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_records (
  id uuid primary key default gen_random_uuid(),
  niche text not null default 'general',
  region text not null default 'unspecified',
  company_size text not null default 'unspecified',
  score integer not null default 0,
  source_kind text not null check (source_kind in ('form', 'csv', 'api', 'ava', 'connector')),
  connector_id text,
  consent_contact boolean not null default false,
  consent_share boolean not null default false,
  consent_at timestamptz,
  has_company boolean not null default false,
  has_website boolean not null default false,
  message_chars integer not null default 0,
  sellable boolean not null default false,
  premium boolean not null default false,
  opted_out boolean not null default false,
  suppressed boolean not null default false,
  enriched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_records_premium_only check (
    premium = true
    and consent_contact = true
    and opted_out = false
    and suppressed = false
  )
);

create table if not exists public.lead_rejected (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  niche text not null default 'general',
  score integer not null default 0,
  source_kind text not null check (source_kind in ('form', 'csv', 'api', 'ava', 'connector')),
  reason text not null check (reason in ('no_consent', 'suppressed', 'opted_out', 'deletion')),
  created_at timestamptz not null default now()
);

create table if not exists public.lead_private_contacts (
  id uuid primary key default gen_random_uuid(),
  staging_id uuid unique references public.lead_staging (id) on delete cascade,
  lead_id uuid unique references public.lead_records (id) on delete cascade,
  email text not null,
  email_hash text not null unique,
  full_name text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  constraint lead_private_one_home check (
    (staging_id is not null and lead_id is null)
    or (staging_id is null and lead_id is not null)
  )
);

create table if not exists public.lead_suppressions (
  email_hash text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users (id) on delete set null,
  niche text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.lead_releases (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.lead_orders (id) on delete cascade,
  lead_id uuid not null references public.lead_records (id) on delete cascade,
  buyer_id uuid not null,
  created_at timestamptz not null default now(),
  unique (order_id, lead_id)
);

alter table public.lead_staging enable row level security;
alter table public.lead_records enable row level security;
alter table public.lead_rejected enable row level security;
alter table public.lead_private_contacts enable row level security;
alter table public.lead_suppressions enable row level security;
alter table public.lead_orders enable row level security;
alter table public.lead_releases enable row level security;

drop policy if exists lead_records_public_read on public.lead_records;
create policy lead_records_public_read
  on public.lead_records
  for select
  to anon, authenticated
  using (
    premium
    and sellable
    and consent_share
    and consent_contact
    and not opted_out
    and not suppressed
  );

drop policy if exists lead_orders_select_own on public.lead_orders;
create policy lead_orders_select_own
  on public.lead_orders
  for select
  to authenticated
  using (auth.uid() = buyer_id);

revoke all on public.lead_staging from public, anon, authenticated;
revoke all on public.lead_rejected from public, anon, authenticated;
revoke all on public.lead_private_contacts from public, anon, authenticated;
revoke all on public.lead_suppressions from public, anon, authenticated;
revoke all on public.lead_releases from public, anon, authenticated;

grant select on public.lead_records to anon, authenticated;
grant select on public.lead_orders to authenticated;
grant select, insert, update, delete on public.lead_staging to service_role;
grant select, insert, update, delete on public.lead_records to service_role;
grant select, insert, update, delete on public.lead_rejected to service_role;
grant select, insert, update, delete on public.lead_private_contacts to service_role;
grant select, insert, update, delete on public.lead_suppressions to service_role;
grant select, insert, update, delete on public.lead_orders to service_role;
grant select, insert, update, delete on public.lead_releases to service_role;

create or replace view public.lead_previews
with (security_invoker = true) as
select id, niche, region, company_size, score, premium, created_at
from public.lead_records
where premium and sellable and consent_share and consent_contact and not opted_out and not suppressed;

grant select on public.lead_previews to anon, authenticated;

-- ===== 20261017_managed_backends.sql =====

-- Defined here because this file sorts before 20261017_owner_role.sql.
-- That later migration replaces the function with the same body.
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner';
$$;

create table if not exists public.managed_backends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_ref text not null,
  name text not null,
  region text not null,
  status text not null default 'provisioning',
  api_url text not null,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

alter table public.managed_backends enable row level security;

drop policy if exists managed_backends_select on public.managed_backends;
create policy managed_backends_select
  on public.managed_backends
  for select
  to authenticated
  using (auth.uid() = owner_id or public.is_owner());

revoke insert, update, delete on public.managed_backends from anon, authenticated;
grant select on public.managed_backends to authenticated;
grant select, insert, update, delete on public.managed_backends to service_role;

-- ===== 20261017_office_appearance.sql =====

-- Owner office appearance. One row per owner. Default is the daily casual look.
-- Service role reads and writes after the server checks OWNER_EMAIL.
-- Authenticated owners can also read and update their own row.

create table if not exists public.owner_office_appearance (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  visitor_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.owner_office_appearance enable row level security;

revoke all on table public.owner_office_appearance from public, anon;
grant select, insert, update on table public.owner_office_appearance to authenticated;
grant select, insert, update, delete on table public.owner_office_appearance to service_role;

drop policy if exists owner_office_select on public.owner_office_appearance;
create policy owner_office_select on public.owner_office_appearance
  for select to authenticated
  using (auth.uid() = owner_id and public.is_owner());

drop policy if exists owner_office_insert on public.owner_office_appearance;
create policy owner_office_insert on public.owner_office_appearance
  for insert to authenticated
  with check (auth.uid() = owner_id and public.is_owner());

drop policy if exists owner_office_update on public.owner_office_appearance;
create policy owner_office_update on public.owner_office_appearance
  for update to authenticated
  using (auth.uid() = owner_id and public.is_owner())
  with check (auth.uid() = owner_id and public.is_owner());

create or replace function public.owner_office_state(owner_email text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((
    select a.visitor_mode
    from auth.users u
    join public.owner_office_appearance a on a.owner_id = u.id
    where lower(u.email) = lower(owner_email)
    limit 1
  ), false);
$$;

revoke all on function public.owner_office_state(text) from public, anon, authenticated;
grant execute on function public.owner_office_state(text) to service_role;

-- ===== 20261017_owner_office_access.sql =====

-- Owner office access. Full lead PII and billing oversight are readable by the
-- owner role (app_metadata.role = owner) and by the service role Ava uses on
-- the server. Signed-in customers and the anon key stay denied.

grant select, update on public.lead_private_contacts to authenticated;
grant select on public.lead_staging to authenticated;
grant select on public.lead_rejected to authenticated;
grant select on public.lead_suppressions to authenticated;
grant select on public.lead_orders to authenticated;
grant select on public.lead_releases to authenticated;

drop policy if exists lead_private_owner_select on public.lead_private_contacts;
create policy lead_private_owner_select on public.lead_private_contacts
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_private_owner_update on public.lead_private_contacts;
create policy lead_private_owner_update on public.lead_private_contacts
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists lead_staging_owner_select on public.lead_staging;
create policy lead_staging_owner_select on public.lead_staging
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_rejected_owner_select on public.lead_rejected;
create policy lead_rejected_owner_select on public.lead_rejected
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_suppressions_owner_select on public.lead_suppressions;
create policy lead_suppressions_owner_select on public.lead_suppressions
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_orders_owner_select on public.lead_orders;
create policy lead_orders_owner_select on public.lead_orders
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_releases_owner_select on public.lead_releases;
create policy lead_releases_owner_select on public.lead_releases
  for select to authenticated
  using (public.is_owner());

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions
  for select to authenticated
  using (public.is_owner());

-- ===== 20261017_owner_role.sql =====

-- Owner role. The mailbox itself is not stored in this file.
-- The server reads OWNER_EMAIL and calls sync_owner_email, which writes the
-- address into private.owner_settings and stamps matching auth users with
-- app_metadata.role = owner. A trigger does the same on later signups.

create schema if not exists private;

create table if not exists private.owner_settings (
  key text primary key,
  value text not null
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.owner_settings from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on table private.owner_settings to service_role;

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles add column if not exists role text default 'member';
  end if;
end $$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner';
$$;

create or replace function private.mark_owner_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  owner_email text;
begin
  select value into owner_email from private.owner_settings where key = 'owner_email';
  if owner_email is not null and lower(coalesce(new.email, '')) = lower(owner_email) then
    new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'owner');
  end if;
  return new;
end;
$$;

drop trigger if exists mark_owner_metadata on auth.users;
create trigger mark_owner_metadata
  before insert or update of email on auth.users
  for each row execute function private.mark_owner_metadata();

create or replace function private.mark_owner_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  owner_email text;
begin
  if to_regclass('public.profiles') is null then
    return new;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    return new;
  end if;
  select value into owner_email from private.owner_settings where key = 'owner_email';
  if owner_email is not null and lower(coalesce(new.email, '')) = lower(owner_email) then
    update public.profiles set role = 'owner' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists mark_owner_profile on auth.users;
create trigger mark_owner_profile
  after insert or update of email on auth.users
  for each row execute function private.mark_owner_profile();

create or replace function public.sync_owner_email(owner_email text)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  clean text := lower(trim(coalesce(owner_email, '')));
begin
  if clean = '' or position('@' in clean) = 0 then
    raise exception 'invalid owner email';
  end if;
  insert into private.owner_settings (key, value)
  values ('owner_email', clean)
  on conflict (key) do update set value = excluded.value;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'owner')
  where lower(email) = clean
    and coalesce(raw_app_meta_data ->> 'role', '') is distinct from 'owner';

  if to_regclass('public.profiles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
     ) then
    update public.profiles set role = 'owner' where lower(email) = clean;
  end if;
end;
$$;

revoke all on function public.sync_owner_email(text) from public, anon, authenticated;
grant execute on function public.sync_owner_email(text) to service_role;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts', 'deals', 'appointments', 'threads', 'thread_messages',
    'campaigns', 'sites', 'automations', 'client_memory', 'client_files'
  ]
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    execute format('drop policy if exists %I_own on public.%I', tbl, tbl);
    execute format(
      'create policy %I_own on public.%I for all to authenticated using (auth.uid() = owner_id or public.is_owner()) with check (auth.uid() = owner_id or public.is_owner())',
      tbl,
      tbl
    );
  end loop;
end $$;

drop policy if exists client_files_read on storage.objects;
drop policy if exists client_files_write on storage.objects;
drop policy if exists client_files_update on storage.objects;
drop policy if exists client_files_delete on storage.objects;

create policy client_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

-- ===== 20261018_complete_backend.sql =====

-- Completes the studio schema around the tables the app already writes.
-- Existing column names stay. New tables, views, and triggers fill the gaps.
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- Workspaces. The owner is not capped. One personal workspace per user is created on first write.
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Personal',
  personal boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists workspaces_personal_owner_idx
  on public.workspaces (owner_id) where personal;

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function public.assign_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid;
begin
  if new.owner_id is null or new.workspace_id is not null then
    return new;
  end if;
  select id into ws from public.workspaces where owner_id = new.owner_id and personal limit 1;
  if ws is null then
    insert into public.workspaces (owner_id, name, personal)
    values (new.owner_id, 'Personal', true)
    on conflict (owner_id) where personal do nothing
    returning id into ws;
    if ws is null then
      select id into ws from public.workspaces where owner_id = new.owner_id and personal limit 1;
    end if;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (ws, new.owner_id, 'owner')
    on conflict (workspace_id, user_id) do nothing;
  end if;
  new.workspace_id := ws;
  return new;
end;
$$;

create or replace function public.can_access_workspace(target uuid, row_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_owner()
    or auth.uid() = row_owner
    or (
      target is not null
      and exists (
        select 1 from public.workspace_members m
        where m.workspace_id = target and m.user_id = auth.uid()
      )
    );
$$;

revoke all on function public.can_access_workspace(uuid, uuid) from public, anon;
grant execute on function public.can_access_workspace(uuid, uuid) to authenticated, service_role;

alter table public.contacts add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.deals add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.appointments add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.threads add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.thread_messages add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.campaigns add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.sites add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.automations add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.client_memory add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.client_files add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;

-- CRM
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  website text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists companies_owner_name_idx on public.companies (owner_id, lower(name));

alter table public.contacts add column if not exists company_id uuid references public.companies (id) on delete set null;

create table if not exists public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  title text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- Pipelines
create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Sales',
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (key in ('new', 'qualified', 'proposal', 'won', 'lost')),
  label text not null,
  position integer not null,
  unique (pipeline_id, key)
);

alter table public.pipeline_stages add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

alter table public.deals add column if not exists pipeline_id uuid references public.pipelines (id) on delete set null;
alter table public.deals add column if not exists stage_id uuid references public.pipeline_stages (id) on delete set null;

-- Automations
create table if not exists public.automation_steps (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  position integer not null default 1,
  action_key text not null,
  created_at timestamptz not null default now(),
  unique (automation_id, position)
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  detail text not null default '',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- Email. Recipient addresses on a client's own list stay in the workspace.
-- Lead-store personal details do not live here.
create table if not exists public.email_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid unique references public.campaigns (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.email_lists (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (list_id, email)
);

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns (id) on delete cascade,
  list_id uuid references public.email_lists (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.email_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  email_hash text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, email_hash)
);

-- Funnels and pages. sites remains the row the studio writes.
create table if not exists public.funnels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  site_id uuid unique references public.sites (id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.funnel_pages (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  path text not null default '',
  headline text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Calendar
create table if not exists public.calendars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Studio',
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.calendars (id) on delete set null,
  appointment_id uuid unique references public.appointments (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  contact_name text not null default '',
  starts_at timestamptz not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Leads engine additions. Personal details stay in lead_private_contacts.
create table if not exists public.lead_niches (
  key text primary key,
  label text not null,
  words text[] not null default '{}'
);

create table if not exists public.lead_consent (
  id uuid primary key default gen_random_uuid(),
  private_contact_id uuid references public.lead_private_contacts (id) on delete cascade,
  staging_id uuid,
  lead_id uuid,
  consent_contact boolean not null,
  consent_share boolean not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.lead_enrichment (
  id uuid primary key default gen_random_uuid(),
  staging_id uuid references public.lead_staging (id) on delete cascade,
  provider text not null default 'none',
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  enriched_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_audit (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  staging_id uuid,
  lead_id uuid,
  email_hash text,
  detail text not null default '',
  created_at timestamptz not null default now()
);

-- Ava config. Pronunciation is the long A.
create table if not exists public.ava_identity (
  id text primary key,
  version text not null,
  name text not null,
  phonetic_spelling text not null,
  ipa text not null,
  ssml_phoneme text not null,
  browser_lang text not null,
  browser_rate numeric not null,
  tts_model text not null,
  tts_voice text not null,
  visual text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ava_dress_codes (
  context text primary key,
  description text not null
);

create table if not exists public.ava_outfit_rotation (
  position integer primary key,
  look_id text not null,
  name text not null,
  note text not null
);

-- PayPal catalog and webhook log. subscriptions remains the live membership row.
create table if not exists public.paypal_plans (
  key text primary key,
  name text not null,
  months integer not null,
  amount numeric(12, 2) not null,
  currency text not null default 'USD'
);

create table if not exists public.paypal_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  paypal_subscription_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

-- White-label jobs. managed_backends remains the project row.
create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  backend_id uuid references public.managed_backends (id) on delete set null,
  name text not null,
  region text not null,
  status text not null default 'provisioning',
  detail text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  key text primary key,
  label text not null,
  href text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Mirrors from the tables the studio already upserts.
create or replace function public.mirror_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_row uuid;
begin
  if length(trim(coalesce(new.company, ''))) > 0 then
    insert into public.companies (workspace_id, owner_id, name)
    values (new.workspace_id, new.owner_id, trim(new.company))
    on conflict (owner_id, lower(name)) do update set workspace_id = excluded.workspace_id
    returning id into company_row;
    if company_row is not null and new.company_id is distinct from company_row then
      update public.contacts set company_id = company_row where id = new.id and company_id is distinct from company_row;
    end if;
  end if;
  if length(trim(coalesce(new.notes, ''))) > 0 and not exists (
    select 1 from public.contact_notes n where n.contact_id = new.id and n.body = new.notes
  ) then
    insert into public.contact_notes (contact_id, workspace_id, owner_id, body)
    values (new.id, new.workspace_id, new.owner_id, new.notes);
  end if;
  return new;
end;
$$;

create or replace function public.mirror_deal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pipe uuid;
  stage_row uuid;
begin
  insert into public.pipelines (workspace_id, owner_id, name)
  values (new.workspace_id, new.owner_id, 'Sales')
  on conflict (owner_id, name) do update set workspace_id = excluded.workspace_id
  returning id into pipe;
  insert into public.pipeline_stages (pipeline_id, workspace_id, owner_id, key, label, position) values
    (pipe, new.workspace_id, new.owner_id, 'new', 'New', 1),
    (pipe, new.workspace_id, new.owner_id, 'qualified', 'Qualified', 2),
    (pipe, new.workspace_id, new.owner_id, 'proposal', 'Proposal', 3),
    (pipe, new.workspace_id, new.owner_id, 'won', 'Won', 4),
    (pipe, new.workspace_id, new.owner_id, 'lost', 'Lost', 5)
  on conflict (pipeline_id, key) do update set workspace_id = excluded.workspace_id;
  select id into stage_row from public.pipeline_stages where pipeline_id = pipe and key = new.stage;
  if new.pipeline_id is distinct from pipe or new.stage_id is distinct from stage_row then
    update public.deals set pipeline_id = pipe, stage_id = stage_row where id = new.id;
  end if;
  return new;
end;
$$;

create or replace function public.mirror_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.channel = 'email' then
    insert into public.email_lists (workspace_id, owner_id, campaign_id, name)
    values (new.workspace_id, new.owner_id, new.id, new.name)
    on conflict (campaign_id) do update set name = excluded.name, workspace_id = excluded.workspace_id;
  end if;
  return new;
end;
$$;

create or replace function public.mirror_site()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  funnel uuid;
begin
  insert into public.funnels (workspace_id, owner_id, site_id, name, status)
  values (new.workspace_id, new.owner_id, new.id, new.name, new.status)
  on conflict (site_id) do update
    set name = excluded.name, status = excluded.status, workspace_id = excluded.workspace_id
  returning id into funnel;
  if not exists (select 1 from public.funnel_pages p where p.funnel_id = funnel and p.position = 0) then
    insert into public.funnel_pages (funnel_id, workspace_id, owner_id, path, headline, position)
    values (funnel, new.workspace_id, new.owner_id, new.path, new.headline, 0);
  else
    update public.funnel_pages
      set path = new.path, headline = new.headline, workspace_id = new.workspace_id
      where funnel_id = funnel and position = 0;
  end if;
  return new;
end;
$$;

create or replace function public.mirror_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.automation_steps (automation_id, workspace_id, owner_id, position, action_key)
  values (new.id, new.workspace_id, new.owner_id, 1, new.action_key)
  on conflict (automation_id, position) do update set action_key = excluded.action_key, workspace_id = excluded.workspace_id;
  return new;
end;
$$;

create or replace function public.mirror_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cal uuid;
begin
  insert into public.calendars (workspace_id, owner_id, name)
  values (new.workspace_id, new.owner_id, 'Studio')
  on conflict (owner_id, name) do update set workspace_id = excluded.workspace_id
  returning id into cal;
  insert into public.bookings (calendar_id, appointment_id, workspace_id, owner_id, title, contact_name, starts_at, notes)
  values (cal, new.id, new.workspace_id, new.owner_id, new.title, new.contact_name, new.starts_at, new.notes)
  on conflict (appointment_id) do update
    set title = excluded.title, contact_name = excluded.contact_name, starts_at = excluded.starts_at, notes = excluded.notes, calendar_id = excluded.calendar_id;
  return new;
end;
$$;

create or replace function public.audit_lead_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  contact_ok boolean := false;
  share_ok boolean := false;
begin
  if new.staging_id is not null then
    select consent_contact, consent_share into contact_ok, share_ok from public.lead_staging where id = new.staging_id;
  elsif new.lead_id is not null then
    select consent_contact, consent_share into contact_ok, share_ok from public.lead_records where id = new.lead_id;
  end if;
  insert into public.lead_consent (private_contact_id, staging_id, lead_id, consent_contact, consent_share)
  values (new.id, new.staging_id, new.lead_id, coalesce(contact_ok, false), coalesce(share_ok, false));
  insert into public.lead_audit (action, staging_id, lead_id, email_hash, detail)
  values ('private_contact_stored', new.staging_id, new.lead_id, new.email_hash, 'personal details stored separately');
  return new;
end;
$$;

-- Score matches lib/leads/engine.ts scoreLead. Service role only.
create or replace function public.promote_premium_leads(min_score integer default 70)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staged public.lead_staging%rowtype;
  contact public.lead_private_contacts%rowtype;
  score integer;
  promoted integer := 0;
  rejected integer := 0;
  held integer := 0;
  created uuid;
begin
  for staged in select * from public.lead_staging limit 500 loop
    select * into contact from public.lead_private_contacts where staging_id = staged.id;
    if contact.id is null then
      delete from public.lead_staging where id = staged.id;
      continue;
    end if;
    if not staged.consent_contact or exists (
      select 1 from public.lead_suppressions s where s.email_hash = contact.email_hash
    ) then
      insert into public.lead_rejected (email_hash, niche, score, source_kind, reason)
      values (
        contact.email_hash,
        staged.niche,
        staged.score,
        staged.source_kind,
        case when staged.consent_contact then 'suppressed' else 'no_consent' end
      );
      insert into public.lead_audit (action, staging_id, email_hash, detail)
      values ('rejected', staged.id, contact.email_hash, case when staged.consent_contact then 'suppressed' else 'no_consent' end);
      delete from public.lead_private_contacts where id = contact.id;
      delete from public.lead_staging where id = staged.id;
      rejected := rejected + 1;
      continue;
    end if;
    score := 20
      + case when staged.consent_share then 20 else 0 end
      + case when staged.has_company then 15 else 0 end
      + case when staged.has_website then 15 else 0 end
      + case when staged.message_chars >= 40 then 15 else 0 end
      + case when staged.niche <> 'general' then 15 else 0 end;
    if score < min_score then
      update public.lead_staging set score = score, updated_at = now() where id = staged.id;
      held := held + 1;
      continue;
    end if;
    insert into public.lead_records (
      niche, region, company_size, score, source_kind, connector_id,
      consent_contact, consent_share, consent_at, has_company, has_website,
      message_chars, sellable, premium, opted_out, suppressed, enriched_at, updated_at
    ) values (
      staged.niche, staged.region, staged.company_size, score, staged.source_kind, staged.connector_id,
      true, staged.consent_share, staged.consent_at, staged.has_company, staged.has_website,
      staged.message_chars, staged.consent_share, true, false, false, staged.enriched_at, now()
    ) returning id into created;
    update public.lead_private_contacts set lead_id = created, staging_id = null where id = contact.id;
    insert into public.lead_audit (action, lead_id, email_hash, detail)
    values ('promoted', created, contact.email_hash, 'premium store');
    delete from public.lead_staging where id = staged.id;
    promoted := promoted + 1;
  end loop;
  return jsonb_build_object('promoted', promoted, 'rejected', rejected, 'held', held);
end;
$$;

revoke all on function public.promote_premium_leads(integer) from public, anon, authenticated;
grant execute on function public.promote_premium_leads(integer) to service_role;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts', 'deals', 'appointments', 'threads', 'thread_messages',
    'campaigns', 'sites', 'automations', 'client_memory', 'client_files'
  ]
  loop
    execute format('drop trigger if exists assign_workspace_%I on public.%I', tbl, tbl);
    execute format(
      'create trigger assign_workspace_%I before insert or update on public.%I for each row execute function public.assign_workspace()',
      tbl, tbl
    );
  end loop;
end $$;

drop trigger if exists mirror_contact on public.contacts;
create trigger mirror_contact after insert or update on public.contacts
  for each row execute function public.mirror_contact();

drop trigger if exists mirror_deal on public.deals;
create trigger mirror_deal after insert or update on public.deals
  for each row execute function public.mirror_deal();

drop trigger if exists mirror_campaign on public.campaigns;
create trigger mirror_campaign after insert or update on public.campaigns
  for each row execute function public.mirror_campaign();

drop trigger if exists mirror_site on public.sites;
create trigger mirror_site after insert or update on public.sites
  for each row execute function public.mirror_site();

drop trigger if exists mirror_automation on public.automations;
create trigger mirror_automation after insert or update on public.automations
  for each row execute function public.mirror_automation();

drop trigger if exists mirror_appointment on public.appointments;
create trigger mirror_appointment after insert or update on public.appointments
  for each row execute function public.mirror_appointment();

drop trigger if exists audit_lead_contact on public.lead_private_contacts;
create trigger audit_lead_contact after insert on public.lead_private_contacts
  for each row execute function public.audit_lead_contact();

create or replace view public.inbox_conversations
with (security_invoker = true) as
select id, owner_id, workspace_id, contact_name, subject, created_at
from public.threads;

create or replace view public.inbox_messages
with (security_invoker = true) as
select id, owner_id, workspace_id, thread_id, body, sender, created_at
from public.thread_messages;

create or replace view public.lead_store
with (security_invoker = true) as
select id, niche, region, company_size, score, premium, created_at
from public.lead_records
where premium and sellable and consent_share and consent_contact and not opted_out and not suppressed;

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.companies enable row level security;
alter table public.contact_notes enable row level security;
alter table public.tasks enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.automation_steps enable row level security;
alter table public.automation_runs enable row level security;
alter table public.email_lists enable row level security;
alter table public.email_list_members enable row level security;
alter table public.email_sends enable row level security;
alter table public.email_unsubscribes enable row level security;
alter table public.funnels enable row level security;
alter table public.funnel_pages enable row level security;
alter table public.calendars enable row level security;
alter table public.bookings enable row level security;
alter table public.lead_niches enable row level security;
alter table public.lead_consent enable row level security;
alter table public.lead_enrichment enable row level security;
alter table public.lead_audit enable row level security;
alter table public.ava_identity enable row level security;
alter table public.ava_dress_codes enable row level security;
alter table public.ava_outfit_rotation enable row level security;
alter table public.paypal_plans enable row level security;
alter table public.paypal_webhook_events enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.affiliate_links enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'companies', 'contact_notes', 'tasks', 'pipelines', 'pipeline_stages',
    'automation_steps', 'automation_runs', 'email_lists', 'email_list_members', 'email_sends',
    'email_unsubscribes', 'funnels', 'funnel_pages', 'calendars', 'bookings'
  ]
  loop
    execute format('drop policy if exists %I_access on public.%I', tbl, tbl);
    execute format(
      'create policy %I_access on public.%I for all to authenticated using (public.can_access_workspace(workspace_id, owner_id)) with check (public.can_access_workspace(workspace_id, owner_id))',
      tbl, tbl
    );
    execute format('revoke all on public.%I from anon', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
    execute format('grant select, insert, update, delete on public.%I to service_role', tbl);
  end loop;
end $$;

-- workspaces uses owner_id, and workspace_id is the row id for members of that workspace.
drop policy if exists workspaces_access on public.workspaces;
create policy workspaces_access on public.workspaces
  for all to authenticated
  using (public.can_access_workspace(id, owner_id))
  with check (public.is_owner() or auth.uid() = owner_id);
revoke all on public.workspaces from anon;
grant select, insert, update, delete on public.workspaces to authenticated, service_role;

drop policy if exists workspace_members_access on public.workspace_members;
create policy workspace_members_access on public.workspace_members
  for all to authenticated
  using (
    public.is_owner()
    or user_id = auth.uid()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  )
  with check (
    public.is_owner()
    or exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

revoke all on public.workspace_members from anon;
grant select, insert, update, delete on public.workspace_members to authenticated, service_role;

drop policy if exists provisioning_jobs_access on public.provisioning_jobs;
create policy provisioning_jobs_access on public.provisioning_jobs
  for all to authenticated
  using (public.is_owner() or auth.uid() = owner_id)
  with check (public.is_owner() or auth.uid() = owner_id);
revoke all on public.provisioning_jobs from anon;
grant select, insert, update, delete on public.provisioning_jobs to authenticated, service_role;

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
      'create policy %I_own on public.%I for all to authenticated using (public.can_access_workspace(workspace_id, owner_id)) with check (public.can_access_workspace(workspace_id, owner_id))',
      tbl, tbl
    );
  end loop;
end $$;

drop policy if exists workspace_owner on public.digimark_workspace;
create policy workspace_owner on public.digimark_workspace
  for all to authenticated
  using (auth.uid() = user_id or public.is_owner())
  with check (auth.uid() = user_id or public.is_owner());

-- Lead PII and audit: owner and service role only.
revoke all on public.lead_consent from public, anon, authenticated;
revoke all on public.lead_enrichment from public, anon, authenticated;
revoke all on public.lead_audit from public, anon, authenticated;
revoke all on public.leads from public, anon, authenticated;
grant select, insert, update, delete on public.lead_consent to service_role;
grant select, insert, update, delete on public.lead_enrichment to service_role;
grant select, insert, update, delete on public.lead_audit to service_role;
grant select on public.lead_consent to authenticated;
grant select on public.lead_enrichment to authenticated;
grant select on public.lead_audit to authenticated;

drop policy if exists lead_consent_owner on public.lead_consent;
create policy lead_consent_owner on public.lead_consent for select to authenticated using (public.is_owner());
drop policy if exists lead_enrichment_owner on public.lead_enrichment;
create policy lead_enrichment_owner on public.lead_enrichment for select to authenticated using (public.is_owner());
drop policy if exists lead_audit_owner on public.lead_audit;
create policy lead_audit_owner on public.lead_audit for select to authenticated using (public.is_owner());

drop policy if exists lead_niches_read on public.lead_niches;
create policy lead_niches_read on public.lead_niches for select to anon, authenticated using (true);
revoke all on public.lead_niches from anon, authenticated;
grant select on public.lead_niches to anon, authenticated;
grant select, insert, update, delete on public.lead_niches to service_role;

drop policy if exists paypal_plans_read on public.paypal_plans;
create policy paypal_plans_read on public.paypal_plans for select to anon, authenticated using (true);
revoke all on public.paypal_plans from anon, authenticated;
grant select on public.paypal_plans to anon, authenticated;
grant select, insert, update, delete on public.paypal_plans to service_role;

drop policy if exists paypal_events_owner on public.paypal_webhook_events;
create policy paypal_events_owner on public.paypal_webhook_events for select to authenticated using (public.is_owner());
revoke all on public.paypal_webhook_events from anon, authenticated;
grant select on public.paypal_webhook_events to authenticated;
grant select, insert, update, delete on public.paypal_webhook_events to service_role;

drop policy if exists ava_identity_read on public.ava_identity;
create policy ava_identity_read on public.ava_identity for select to anon, authenticated using (true);
drop policy if exists ava_dress_read on public.ava_dress_codes;
create policy ava_dress_read on public.ava_dress_codes for select to anon, authenticated using (true);
drop policy if exists ava_outfit_read on public.ava_outfit_rotation;
create policy ava_outfit_read on public.ava_outfit_rotation for select to anon, authenticated using (true);
revoke all on public.ava_identity from anon, authenticated;
revoke all on public.ava_dress_codes from anon, authenticated;
revoke all on public.ava_outfit_rotation from anon, authenticated;
grant select on public.ava_identity to anon, authenticated;
grant select on public.ava_dress_codes to anon, authenticated;
grant select on public.ava_outfit_rotation to anon, authenticated;
grant select, insert, update, delete on public.ava_identity to service_role;
grant select, insert, update, delete on public.ava_dress_codes to service_role;
grant select, insert, update, delete on public.ava_outfit_rotation to service_role;

drop policy if exists affiliate_read on public.affiliate_links;
create policy affiliate_read on public.affiliate_links for select to authenticated using (true);
drop policy if exists affiliate_owner_write on public.affiliate_links;
create policy affiliate_owner_write on public.affiliate_links
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
revoke all on public.affiliate_links from anon;
grant select on public.affiliate_links to authenticated;
grant select, insert, update, delete on public.affiliate_links to service_role;

grant select on public.inbox_conversations to authenticated;
grant select on public.inbox_messages to authenticated;
grant select on public.lead_store to anon, authenticated;

create index if not exists workspaces_owner_idx on public.workspaces (owner_id);
create index if not exists workspace_members_user_idx on public.workspace_members (user_id);
create index if not exists contacts_workspace_idx on public.contacts (workspace_id);
create index if not exists deals_workspace_idx on public.deals (workspace_id);
create index if not exists tasks_owner_idx on public.tasks (owner_id);
create index if not exists lead_audit_created_idx on public.lead_audit (created_at desc);
create index if not exists lead_consent_contact_idx on public.lead_consent (private_contact_id);
create index if not exists provisioning_jobs_owner_idx on public.provisioning_jobs (owner_id);
create index if not exists paypal_events_type_idx on public.paypal_webhook_events (event_type);

insert into public.lead_niches (key, label, words) values
  ('general', 'General', '{}'),
  ('seo', 'SEO', '{seo,search,ranking}'),
  ('paid-ads', 'Paid ads', '{ads,ppc,paid}'),
  ('social', 'Social', '{social,instagram,linkedin,tiktok}'),
  ('content', 'Content', '{content,copy,blog}'),
  ('web', 'Web', '{web,website,landing}'),
  ('email', 'Email', '{email,newsletter}'),
  ('analytics', 'Analytics', '{analytics,tracking,measurement}'),
  ('ai', 'AI', '{ai,automation,ava}')
on conflict (key) do update set label = excluded.label, words = excluded.words;

insert into public.paypal_plans (key, name, months, amount, currency) values
  ('monthly', 'Monthly', 1, 497.00, 'USD'),
  ('quarterly', 'Quarterly', 3, 1312.00, 'USD'),
  ('semiannual', 'Semiannual', 6, 2326.00, 'USD')
on conflict (key) do update set name = excluded.name, months = excluded.months, amount = excluded.amount;

insert into public.ava_identity (
  id, version, name, phonetic_spelling, ipa, ssml_phoneme, browser_lang, browser_rate, tts_model, tts_voice, visual
) values (
  'ava-skye',
  '2026.10.17',
  'Ava Skye',
  'Ay-vuh',
  '/ˈeɪvə/',
  'ˈeɪvə',
  'en-US',
  1,
  'tts-1',
  'nova',
  'Long dark wavy hair, warm complexion, defined brows, dark studio portraits.'
) on conflict (id) do update set
  version = excluded.version,
  phonetic_spelling = excluded.phonetic_spelling,
  ipa = excluded.ipa,
  ssml_phoneme = excluded.ssml_phoneme;

insert into public.ava_dress_codes (context, description) values
  ('digimark101', 'Professional. Blazer or tailored jacket. Tasteful and non-explicit.'),
  ('avaskye-casual', 'Relaxed daily rotation: cozy knit, tee and joggers, off-shoulder sweater, soft hoodie.'),
  ('avaskye-visitor', 'Visitor mode switches the office to the professional blazer.')
on conflict (context) do update set description = excluded.description;

insert into public.ava_outfit_rotation (position, look_id, name, note) values
  (0, 'knit', 'Cozy knit', 'A relaxed cream knit with the sleeves pushed up.'),
  (1, 'tee', 'Tee and joggers', 'A fitted tee with heather joggers.'),
  (2, 'sweater', 'Off-shoulder sweater', 'A soft sweater sitting on one shoulder, still fully covered.'),
  (3, 'hoodie', 'Soft hoodie', 'An easy hoodie with the hood down.')
on conflict (position) do update set look_id = excluded.look_id, name = excluded.name, note = excluded.note;

insert into public.affiliate_links (key, label, href, enabled) values
  ('supabase', 'Supabase', '', false),
  ('vercel', 'Vercel', '', false)
on conflict (key) do nothing;

-- ===== 20261019_office_records.sql =====

-- Owner books. Invoices, expenses, and office records live here.
-- The service role on avaskye.online writes them. Customers cannot read them.

create table if not exists public.office_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'expense', 'record', 'legal')),
  title text not null,
  party text not null default '',
  amount numeric(12, 2),
  currency text not null default 'USD',
  status text not null default 'open' check (status in ('open', 'paid', 'filed')),
  notes text not null default '',
  occurred_on date,
  product_key text not null default 'digimark101',
  created_at timestamptz not null default now()
);

alter table public.office_records enable row level security;

drop policy if exists office_records_owner on public.office_records;
create policy office_records_owner on public.office_records
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create index if not exists office_records_kind_idx on public.office_records (kind, created_at desc);

-- ===== 20261019_product_hub.sql =====

-- Every office row belongs to one product. DigiMark101 is the first.
-- A later Ava Skye product uses its own key and does not mix into this one.

alter table public.campaigns add column if not exists product_key text not null default 'digimark101';
create index if not exists campaigns_product_idx on public.campaigns (product_key);

alter table public.office_records add column if not exists product_key text not null default 'digimark101';
create index if not exists office_records_product_idx on public.office_records (product_key);

-- ===== 20261021_office_media.sql =====

-- Owner media and reusable assets. Links, creatives, copy, and anything already used or planned.
-- Service role on avaskye.online writes them. Customers cannot read them.

create table if not exists public.office_media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'copy', 'creative', 'document', 'other')),
  title text not null,
  url text not null default '',
  notes text not null default '',
  status text not null default 'planned' check (status in ('planned', 'used', 'archived')),
  product_key text not null default 'digimark101',
  used_on date,
  created_at timestamptz not null default now()
);

alter table public.office_media enable row level security;

drop policy if exists office_media_owner on public.office_media;
create policy office_media_owner on public.office_media
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create index if not exists office_media_product_idx on public.office_media (product_key, created_at desc);
create index if not exists office_media_status_idx on public.office_media (status);

-- ===== 20261024_client_onboarding.sql =====

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

-- ===== 20261024_platform_tokens.sql =====

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

-- ===== 20261024_platform_tokens_linkedin_tiktok.sql =====

-- supabase/migrations/20261024_platform_tokens_linkedin_tiktok.sql
-- Extend platform_tokens to support LinkedIn and TikTok

alter table platform_tokens
  drop constraint if exists platform_tokens_platform_check;

alter table platform_tokens
  add constraint platform_tokens_platform_check
  check (platform in ('facebook', 'instagram', 'google', 'website', 'linkedin', 'tiktok'));

-- ===== 20261025_seats.sql =====

-- Seats sold through PayPal, requested from the pricing form, or granted in the office.
-- Safe to re-run. Service role is the only writer. The project ref is never stored here.

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  plan_key text not null default 'monthly',
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  source text not null check (source in ('paypal', 'manual', 'request')),
  paypal_subscription_id text,
  granted_by uuid,
  invite_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seats_open_email_idx
  on public.seats (lower(email))
  where status in ('pending', 'active');

create index if not exists seats_user_idx on public.seats (user_id);
create index if not exists seats_paypal_idx on public.seats (paypal_subscription_id);

create or replace function public.deliver_seat(
  seat_email text,
  seat_plan text,
  seat_source text,
  seat_user uuid default null,
  seat_paypal text default null,
  seat_granted_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user uuid;
  ws uuid;
  seat_id uuid;
  next_status text;
begin
  if seat_user is not null and nullif(trim(coalesce(seat_email, '')), '') is null then
    select email into seat_email from auth.users where id = seat_user;
  end if;
  seat_email := lower(trim(coalesce(seat_email, '')));
  if seat_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if seat_plan not in ('starter', 'monthly', 'quarterly', 'semiannual') then
    seat_plan := 'monthly';
  end if;
  if seat_source not in ('paypal', 'manual', 'request') then
    return jsonb_build_object('ok', false, 'error', 'source');
  end if;

  select id into found_user
  from auth.users
  where (seat_user is not null and id = seat_user)
     or lower(email) = seat_email
  order by case when seat_user is not null and id = seat_user then 0 else 1 end
  limit 1;

  insert into public.seats (email, plan_key, source, status, user_id, paypal_subscription_id, granted_by)
  values (
    seat_email,
    seat_plan,
    seat_source,
    'pending',
    found_user,
    nullif(trim(coalesce(seat_paypal, '')), ''),
    seat_granted_by
  )
  on conflict ((lower(email))) where status in ('pending', 'active')
  do update set
    plan_key = excluded.plan_key,
    source = excluded.source,
    user_id = coalesce(excluded.user_id, public.seats.user_id),
    paypal_subscription_id = coalesce(excluded.paypal_subscription_id, public.seats.paypal_subscription_id),
    granted_by = coalesce(excluded.granted_by, public.seats.granted_by),
    updated_at = now()
  returning id into seat_id;

  next_status := 'pending';
  if found_user is not null and seat_source in ('paypal', 'manual') then
    select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
    if ws is null then
      insert into public.workspaces (owner_id, name, personal)
      values (found_user, 'Personal', true)
      on conflict (owner_id) where personal do nothing
      returning id into ws;
      if ws is null then
        select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
      end if;
      insert into public.workspace_members (workspace_id, user_id, role)
      values (ws, found_user, 'owner')
      on conflict (workspace_id, user_id) do nothing;
    end if;
    next_status := 'active';
    update public.seats
    set user_id = found_user, workspace_id = ws, status = 'active', updated_at = now()
    where id = seat_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'seat_id', seat_id,
    'user_id', found_user,
    'workspace_id', ws,
    'status', next_status,
    'email', seat_email
  );
end;
$$;

revoke all on function public.deliver_seat(text, text, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_seat(text, text, text, uuid, text, uuid) to service_role;

alter table public.seats enable row level security;

drop policy if exists seats_select on public.seats;
create policy seats_select on public.seats
  for select to authenticated
  using (public.is_owner() or auth.uid() = user_id);

revoke all on public.seats from anon;
grant select on public.seats to authenticated;
grant select, insert, update, delete on public.seats to service_role;

-- ===== 20261025_social_accounts.sql =====

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

-- ===== 20261026_client_onboarding_user_id_unique.sql =====

-- One onboarding row per account. The earlier index on user_id is not unique,
-- so PostgREST upsert (on conflict user_id) cannot target it.
-- Deduplicate first, then replace that lookup index with a unique one.
-- Safe to re-run. Must run after 20261024_client_onboarding.sql.

delete from public.client_onboarding as older
using public.client_onboarding as newer
where older.user_id is not null
  and older.user_id = newer.user_id
  and older.id <> newer.id
  and (
    older.updated_at < newer.updated_at
    or (older.updated_at is not distinct from newer.updated_at and older.created_at < newer.created_at)
    or (
      older.updated_at is not distinct from newer.updated_at
      and older.created_at is not distinct from newer.created_at
      and older.id < newer.id
    )
  );

drop index if exists public.idx_client_onboarding_user_id;

create unique index if not exists client_onboarding_user_id_uidx
  on public.client_onboarding (user_id);

-- ===== initial_schema.sql =====

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial',
  onboarding_completed BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

CREATE TABLE IF NOT EXISTS public.ava_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ava_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_memory_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type TEXT CHECK (memory_type IN ('brand', 'preference', 'conversation', 'project')),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  importance_score INTEGER DEFAULT 5,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, memory_type, key)
);

CREATE TABLE IF NOT EXISTS public.ava_brand_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT,
  brand_voice TEXT,
  brand_values TEXT[],
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  call_sid TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  phone_number TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_memory_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_brand_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_voice_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "Users can view own conversations" ON public.ava_conversations;
CREATE POLICY "Users can view own conversations"
  ON public.ava_conversations FOR SELECT
  USING (auth.uid() = user_id OR public.is_owner());

DROP POLICY IF EXISTS "Users can view own messages" ON public.ava_messages;
CREATE POLICY "Users can view own messages"
  ON public.ava_messages FOR SELECT
  USING (auth.uid() = user_id OR public.is_owner());

DROP POLICY IF EXISTS "Users can insert own messages" ON public.ava_messages;
CREATE POLICY "Users can insert own messages"
  ON public.ava_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_owner());

CREATE INDEX IF NOT EXISTS idx_ava_messages_conversation ON public.ava_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ava_messages_user ON public.ava_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_user ON public.ava_memory_store(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
