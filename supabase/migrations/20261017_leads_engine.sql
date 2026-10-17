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
