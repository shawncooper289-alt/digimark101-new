-- DigiMark101 multi-tenant marketing platform foundation.
-- Apply with the Supabase CLI or SQL Editor after reviewing the migration.

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'marketer', 'client', 'viewer');
create type public.subscription_tier as enum ('startup', 'growth', 'elite');
create type public.approval_status as enum ('not_required', 'pending', 'approved', 'rejected', 'expired');
create type public.task_status as enum ('draft', 'queued', 'in_progress', 'awaiting_approval', 'completed', 'failed', 'cancelled');
create type public.agent_run_status as enum ('queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled');
create type public.white_label_mode as enum ('none', 'branded_portal', 'reseller');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid not null references auth.users(id) on delete restrict,
  subscription_tier public.subscription_tier not null default 'startup',
  white_label_mode public.white_label_mode not null default 'none',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'client',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_branding (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  brand_name text,
  logo_url text,
  primary_color text check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  domain text,
  voice_guidelines text,
  target_audience jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  website_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 160),
  channel text not null check (channel in ('content', 'seo', 'social', 'email', 'ads', 'crm', 'website', 'other')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  objectives jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specialist_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name text not null,
  capability text not null,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (workspace_id, key)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  parent_id uuid references public.work_items(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  description text,
  status public.task_status not null default 'draft',
  requires_approval boolean not null default true,
  approval_status public.approval_status not null default 'pending',
  requested_by uuid references auth.users(id) on delete set null,
  assigned_agent_id uuid references public.specialist_agents(id) on delete set null,
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((requires_approval and approval_status in ('pending', 'approved', 'rejected', 'expired')) or (not requires_approval and approval_status = 'not_required'))
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  agent_id uuid references public.specialist_agents(id) on delete set null,
  status public.agent_run_status not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  status public.approval_status not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text,
  expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ava_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  title text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ava_thread_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ava_threads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sender_type text not null check (sender_type in ('user', 'ava', 'specialist', 'system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  trigger jsonb not null,
  actions jsonb not null,
  enabled boolean not null default false,
  require_approval boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entitlement_key text not null,
  limit_value integer check (limit_value is null or limit_value >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, entitlement_key)
);

create index clients_workspace_idx on public.clients(workspace_id);
create index campaigns_workspace_idx on public.campaigns(workspace_id);
create index work_items_workspace_status_idx on public.work_items(workspace_id, status);
create index agent_runs_workspace_status_idx on public.agent_runs(workspace_id, status);
create index approvals_workspace_status_idx on public.approvals(workspace_id, status);
create index ava_thread_messages_conversation_idx on public.ava_thread_messages(conversation_id, created_at);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_operator(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'marketer')
  );
$$;

create or replace function public.is_workspace_decider(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns public.workspaces language plpgsql security definer set search_path = public as $$
declare created_workspace public.workspaces;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  insert into public.workspaces (name, slug, owner_id)
  values (workspace_name, workspace_slug, auth.uid())
  returning * into created_workspace;
  insert into public.workspace_members (workspace_id, user_id, role)
  values (created_workspace.id, auth.uid(), 'owner');
  return created_workspace;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.prevent_workspace_owner_change()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Workspace ownership must be transferred through a trusted server workflow';
  end if;
  return new;
end;
$$;

create or replace function public.record_approval_decision()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if old.status <> 'pending' and new.status is distinct from old.status then
    raise exception 'A finalized approval cannot be changed';
  end if;
  if new.status in ('approved', 'rejected', 'expired') and old.status = 'pending' then
    new.decided_by = auth.uid();
    new.decided_at = now();
  end if;
  return new;
end;
$$;

create trigger workspaces_prevent_owner_change before update on public.workspaces for each row execute function public.prevent_workspace_owner_change();
create trigger workspaces_touch_updated_at before update on public.workspaces for each row execute function public.touch_updated_at();
create trigger approvals_record_decision before update on public.approvals for each row execute function public.record_approval_decision();
create trigger clients_touch_updated_at before update on public.clients for each row execute function public.touch_updated_at();
create trigger campaigns_touch_updated_at before update on public.campaigns for each row execute function public.touch_updated_at();
create trigger work_items_touch_updated_at before update on public.work_items for each row execute function public.touch_updated_at();
create trigger automation_rules_touch_updated_at before update on public.automation_rules for each row execute function public.touch_updated_at();
create trigger workspace_branding_touch_updated_at before update on public.workspace_branding for each row execute function public.touch_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_branding enable row level security;
alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.specialist_agents enable row level security;
alter table public.work_items enable row level security;
alter table public.agent_runs enable row level security;
alter table public.approvals enable row level security;
alter table public.ava_threads enable row level security;
alter table public.ava_thread_messages enable row level security;
alter table public.automation_rules enable row level security;
alter table public.entitlement_overrides enable row level security;

-- Members may read tenant data. Operators administer work; approvals require owner/admin.
create policy workspaces_select on public.workspaces for select using (public.is_workspace_member(id));
create policy workspaces_update on public.workspaces for update using (public.is_workspace_operator(id)) with check (public.is_workspace_operator(id));
create policy members_select on public.workspace_members for select using (public.is_workspace_member(workspace_id));

create policy workspace_branding_access on public.workspace_branding for select using (public.is_workspace_member(workspace_id));
create policy workspace_branding_manage on public.workspace_branding for all using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));

create policy clients_access on public.clients for select using (public.is_workspace_member(workspace_id));
create policy clients_manage on public.clients for all using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));
create policy campaigns_access on public.campaigns for select using (public.is_workspace_member(workspace_id));
create policy campaigns_manage on public.campaigns for all using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));
create policy agents_access on public.specialist_agents for select using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy agents_manage on public.specialist_agents for all using (workspace_id is not null and public.is_workspace_operator(workspace_id)) with check (workspace_id is not null and public.is_workspace_operator(workspace_id));

create policy work_items_access on public.work_items for select using (public.is_workspace_member(workspace_id));
create policy work_items_insert on public.work_items for insert with check (public.is_workspace_member(workspace_id));
create policy work_items_update on public.work_items for update using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));
create policy agent_runs_access on public.agent_runs for select using (public.is_workspace_member(workspace_id));
create policy approvals_access on public.approvals for select using (public.is_workspace_member(workspace_id));
create policy approvals_decide on public.approvals for update using (public.is_workspace_decider(workspace_id)) with check (public.is_workspace_decider(workspace_id));
create policy conversations_access on public.ava_threads for select using (public.is_workspace_member(workspace_id));
create policy conversations_insert on public.ava_threads for insert with check (public.is_workspace_member(workspace_id));
create policy messages_access on public.ava_thread_messages for select using (public.is_workspace_member(workspace_id));
create policy messages_insert on public.ava_thread_messages for insert with check (public.is_workspace_member(workspace_id) and sender_type = 'user' and sender_user_id = auth.uid());
create policy automations_access on public.automation_rules for select using (public.is_workspace_member(workspace_id));
create policy automations_manage on public.automation_rules for all using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));
create policy entitlements_access on public.entitlement_overrides for select using (public.is_workspace_member(workspace_id));
create policy entitlements_manage on public.entitlement_overrides for all using (public.is_workspace_operator(workspace_id)) with check (public.is_workspace_operator(workspace_id));

-- Service-role-only writes: workspace membership, agent runs, approvals creation, and specialist messages have no client write policies. Route Ava/tool execution through trusted server code.
