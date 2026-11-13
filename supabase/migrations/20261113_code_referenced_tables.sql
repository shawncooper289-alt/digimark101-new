-- Tables the app already reads or writes that were missing on the live project.
-- Idempotent. Does not replay older functions whose argument names drifted.
-- Owner-only for internal logs. A signed-in client can write their own tasks,
-- email-list drafts, and backend requests.

create table if not exists public.paypal_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  paypal_subscription_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
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

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  backend_id uuid references public.managed_backends (id) on delete set null,
  name text not null,
  region text not null,
  status text not null default 'requested',
  detail text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table if not exists public.email_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  campaign_id uuid unique references public.campaigns (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  key text primary key,
  label text not null,
  href text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.paypal_webhook_events enable row level security;
alter table public.lead_audit enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.tasks enable row level security;
alter table public.email_lists enable row level security;
alter table public.affiliate_links enable row level security;

revoke all on public.paypal_webhook_events from public, anon, authenticated;
revoke all on public.lead_audit from public, anon, authenticated;
revoke all on public.affiliate_links from public, anon, authenticated;
revoke all on public.provisioning_jobs from public, anon;
revoke all on public.tasks from public, anon;
revoke all on public.email_lists from public, anon;

grant select on public.paypal_webhook_events to authenticated;
grant select, insert, update, delete on public.paypal_webhook_events to service_role;
grant select on public.lead_audit to authenticated;
grant select, insert, update, delete on public.lead_audit to service_role;
grant select on public.affiliate_links to authenticated;
grant select, insert, update, delete on public.affiliate_links to service_role;
grant select, insert, update, delete on public.provisioning_jobs to authenticated, service_role;
grant select, insert, update, delete on public.tasks to authenticated, service_role;
grant select, insert, update, delete on public.email_lists to authenticated, service_role;

drop policy if exists paypal_events_owner on public.paypal_webhook_events;
create policy paypal_events_owner on public.paypal_webhook_events
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_audit_owner on public.lead_audit;
create policy lead_audit_owner on public.lead_audit
  for select to authenticated
  using (public.is_owner());

drop policy if exists affiliate_links_owner on public.affiliate_links;
create policy affiliate_links_owner on public.affiliate_links
  for select to authenticated
  using (public.is_owner());

drop policy if exists provisioning_jobs_own on public.provisioning_jobs;
create policy provisioning_jobs_own on public.provisioning_jobs
  for all to authenticated
  using ((select auth.uid()) = owner_id or public.is_owner())
  with check ((select auth.uid()) = owner_id or public.is_owner());

drop policy if exists tasks_own on public.tasks;
create policy tasks_own on public.tasks
  for all to authenticated
  using ((select auth.uid()) = owner_id or public.is_owner())
  with check ((select auth.uid()) = owner_id or public.is_owner());

drop policy if exists email_lists_own on public.email_lists;
create policy email_lists_own on public.email_lists
  for all to authenticated
  using ((select auth.uid()) = owner_id or public.is_owner())
  with check ((select auth.uid()) = owner_id or public.is_owner());

create index if not exists paypal_events_type_idx on public.paypal_webhook_events (event_type);
create index if not exists lead_audit_created_idx on public.lead_audit (created_at desc);
create index if not exists provisioning_jobs_owner_idx on public.provisioning_jobs (owner_id);
create index if not exists provisioning_jobs_backend_idx on public.provisioning_jobs (backend_id);
create index if not exists tasks_owner_idx on public.tasks (owner_id);
create index if not exists tasks_contact_idx on public.tasks (contact_id);
create index if not exists email_lists_owner_idx on public.email_lists (owner_id);

-- Buyer-facing lead list. No personal email or phone. security_invoker keeps
-- the lead_records row policy in force.
create or replace view public.lead_store
with (security_invoker = true) as
select id, niche, region, company_size, score, premium, created_at
from public.lead_records
where premium and sellable and consent_share and consent_contact and not opted_out and not suppressed;

alter view public.lead_store set (security_invoker = true);
revoke all on public.lead_store from public;
grant select on public.lead_store to anon, authenticated, service_role;
