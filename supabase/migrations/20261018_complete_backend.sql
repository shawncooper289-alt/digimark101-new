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
