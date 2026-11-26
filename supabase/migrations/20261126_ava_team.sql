-- Ava's specialist team.
-- Write-only in this repo. Do not apply it to a live Supabase project from the app.
-- Shawn applies it later, after review.
-- Owner-scoped. Clients do not get these rows.
-- Safe to re-run.

alter table public.specialist_tasks
  add column if not exists workspace_id uuid references public.workspaces (id) on delete set null,
  add column if not exists parent_id uuid references public.specialist_tasks (id) on delete set null,
  add column if not exists priority integer not null default 0,
  add column if not exists due_at timestamptz,
  add column if not exists idempotency_key text,
  add column if not exists attempts integer not null default 0;

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'specialist_tasks'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
      and pg_get_constraintdef(con.oid) not ilike '%status%'
  loop
    execute format('alter table public.specialist_tasks drop constraint %I', cname);
  end loop;
end $$;

alter table public.specialist_tasks drop constraint if exists specialist_tasks_role_check;
alter table public.specialist_tasks
  add constraint specialist_tasks_role_check
  check (role in (
    'copywriter', 'social', 'ads', 'seo', 'followup', 'research',
    'traffic', 'content', 'nurture', 'outreach', 'sentinel'
  ));

alter table public.specialist_tasks drop constraint if exists specialist_tasks_priority_check;
alter table public.specialist_tasks
  add constraint specialist_tasks_priority_check
  check (priority between 0 and 100);

alter table public.specialist_tasks drop constraint if exists specialist_tasks_attempts_check;
alter table public.specialist_tasks
  add constraint specialist_tasks_attempts_check
  check (attempts >= 0 and attempts <= 20);

create unique index if not exists specialist_tasks_idempotency_idx
  on public.specialist_tasks (owner_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists specialist_tasks_parent_idx
  on public.specialist_tasks (parent_id)
  where parent_id is not null;

create index if not exists specialist_tasks_queue_idx
  on public.specialist_tasks (owner_id, status, priority desc, due_at, created_at);

create index if not exists specialist_tasks_workspace_idx
  on public.specialist_tasks (workspace_id);

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  slug text not null check (slug in ('traffic', 'content', 'nurture', 'outreach', 'sentinel')),
  title text not null,
  prompt text not null,
  tool_allow_list text[] not null default '{}',
  autonomy text not null default 'draft' check (autonomy in ('draft', 'confirm', 'read_only')),
  monthly_budget_cents integer not null default 1200 check (monthly_budget_cents >= 0 and monthly_budget_cents <= 6000),
  daily_token_cap integer not null default 20000 check (daily_token_cap >= 0 and daily_token_cap <= 200000),
  per_run_token_cap integer not null default 4000 check (per_run_token_cap >= 0 and per_run_token_cap <= 20000),
  paused boolean not null default false,
  pause_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug),
  check (
    (slug = 'sentinel' and autonomy = 'read_only')
    or (slug <> 'sentinel' and autonomy in ('draft', 'confirm'))
  )
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  agent_slug text not null check (agent_slug in ('traffic', 'content', 'nurture', 'outreach', 'sentinel')),
  parent_run_id uuid references public.agent_runs (id) on delete set null,
  task_id uuid references public.specialist_tasks (id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'review', 'done', 'failed', 'paused', 'cancelled')),
  brief jsonb not null default '{}'::jsonb,
  tokens_in integer not null default 0 check (tokens_in >= 0),
  tokens_out integer not null default 0 check (tokens_out >= 0),
  cost_micro_usd bigint not null default 0 check (cost_micro_usd >= 0),
  idempotency_key text,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create unique index if not exists agent_runs_idempotency_idx
  on public.agent_runs (owner_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists agent_runs_owner_slug_idx
  on public.agent_runs (owner_id, agent_slug, created_at desc);

create index if not exists agent_runs_owner_status_idx
  on public.agent_runs (owner_id, status, created_at desc);

create index if not exists agent_runs_parent_idx
  on public.agent_runs (parent_run_id)
  where parent_run_id is not null;

create index if not exists agent_runs_task_idx
  on public.agent_runs (task_id)
  where task_id is not null;

create index if not exists agent_runs_workspace_idx
  on public.agent_runs (workspace_id);

create table if not exists public.agent_artifacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  run_id uuid references public.agent_runs (id) on delete cascade,
  agent_slug text not null,
  kind text not null,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published', 'rejected')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_artifacts_owner_status_idx
  on public.agent_artifacts (owner_id, status, created_at desc);

create index if not exists agent_artifacts_run_idx
  on public.agent_artifacts (run_id);

create index if not exists agent_artifacts_workspace_idx
  on public.agent_artifacts (workspace_id);

create table if not exists public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  actor_id uuid not null references auth.users (id) on delete cascade,
  run_id uuid references public.agent_runs (id) on delete set null,
  artifact_id uuid references public.agent_artifacts (id) on delete set null,
  tool text not null,
  target text not null default '',
  params jsonb not null default '{}'::jsonb,
  params_hash text not null,
  effect text not null check (effect in ('read', 'write', 'destructive', 'outbound')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  expires_at timestamptz not null,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now()
);

create index if not exists agent_approvals_pending_idx
  on public.agent_approvals (owner_id, status, expires_at)
  where status = 'pending';

create index if not exists agent_approvals_actor_idx
  on public.agent_approvals (actor_id, created_at desc);

create index if not exists agent_approvals_run_idx
  on public.agent_approvals (run_id);

create index if not exists agent_approvals_artifact_idx
  on public.agent_approvals (artifact_id)
  where artifact_id is not null;

create index if not exists agent_approvals_workspace_idx
  on public.agent_approvals (workspace_id);

create table if not exists public.muse_handoffs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  goal text not null,
  audience text not null default '',
  brand_voice text not null default '',
  assets jsonb not null default '[]'::jsonb,
  constraints text not null default '',
  deadline text not null default '',
  approval_needs text not null default '',
  success_metric text not null default '',
  brief_text text not null,
  status text not null default 'open' check (status in ('open', 'submitted', 'reviewed')),
  muse_result text,
  ava_review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists muse_handoffs_owner_status_idx
  on public.muse_handoffs (owner_id, status, created_at desc);

create index if not exists muse_handoffs_workspace_idx
  on public.muse_handoffs (workspace_id);

create table if not exists public.traffic_kpis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  source text not null check (source in ('gsc', 'ga4', 'bing', 'indexnow', 'manual')),
  period_start date not null,
  period_end date not null,
  metric text not null,
  value numeric(18, 4) not null,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (owner_id, source, period_start, period_end, metric)
);

create index if not exists traffic_kpis_owner_source_idx
  on public.traffic_kpis (owner_id, source, period_start desc);

create index if not exists traffic_kpis_workspace_idx
  on public.traffic_kpis (workspace_id);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'specialist_tasks',
    'agent_profiles',
    'agent_runs',
    'agent_artifacts',
    'agent_approvals',
    'muse_handoffs',
    'traffic_kpis'
  ]
  loop
    execute format('drop trigger if exists assign_workspace_%I on public.%I', tbl, tbl);
    execute format(
      'create trigger assign_workspace_%I before insert or update on public.%I for each row execute function public.assign_workspace()',
      tbl, tbl
    );
  end loop;
end $$;

update public.specialist_tasks
set priority = priority
where workspace_id is null;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'agent_profiles',
    'agent_runs',
    'agent_artifacts',
    'agent_approvals',
    'muse_handoffs',
    'traffic_kpis'
  ]
  loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I_owner on public.%I', tbl, tbl);
    execute format(
      'create policy %I_owner on public.%I for all to authenticated using ((select public.is_owner()) and (select public.can_access_workspace(workspace_id, owner_id))) with check ((select public.is_owner()) and (select public.can_access_workspace(workspace_id, owner_id)))',
      tbl, tbl
    );
    execute format('revoke all on public.%I from anon, public', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
    execute format('grant select, insert, update, delete on public.%I to service_role', tbl);
  end loop;
end $$;

-- The six original helpers stay on the old claim. The five team roles use their own claim.
create or replace function public.claim_specialist_tasks(p_owner uuid, p_limit integer)
returns setof public.specialist_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  open_slots integer;
begin
  if p_owner is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext('specialist:' || p_owner::text));
  select greatest(0, 6 - count(*))::integer into open_slots
  from public.specialist_tasks
  where owner_id = p_owner
    and status = 'running'
    and role in ('copywriter', 'social', 'ads', 'seo', 'followup', 'research');
  open_slots := least(open_slots, greatest(coalesce(p_limit, 0), 0));
  if open_slots <= 0 then
    return;
  end if;
  return query
  with next_jobs as (
    select id
    from public.specialist_tasks
    where owner_id = p_owner
      and status = 'queued'
      and role in ('copywriter', 'social', 'ads', 'seo', 'followup', 'research')
    order by priority desc, due_at nulls last, created_at
    limit open_slots
    for update skip locked
  )
  update public.specialist_tasks as task
  set status = 'running', started_at = coalesce(task.started_at, now())
  from next_jobs
  where task.id = next_jobs.id
  returning task.*;
end;
$$;

create or replace function public.claim_agent_tasks(p_owner uuid, p_limit integer)
returns setof public.specialist_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  open_slots integer;
begin
  if p_owner is null then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtext('agent:' || p_owner::text));
  update public.specialist_tasks
  set status = 'failed',
      error = 'Stopped after 5 attempts.',
      finished_at = now()
  where owner_id = p_owner
    and status = 'queued'
    and role in ('traffic', 'content', 'nurture', 'outreach', 'sentinel')
    and attempts >= 5;
  select greatest(0, 5 - count(*))::integer into open_slots
  from public.specialist_tasks
  where owner_id = p_owner
    and status = 'running'
    and role in ('traffic', 'content', 'nurture', 'outreach', 'sentinel');
  open_slots := least(open_slots, greatest(coalesce(p_limit, 0), 0));
  if open_slots <= 0 then
    return;
  end if;
  return query
  with next_jobs as (
    select id
    from public.specialist_tasks
    where owner_id = p_owner
      and status = 'queued'
      and role in ('traffic', 'content', 'nurture', 'outreach', 'sentinel')
    order by priority desc, due_at nulls last, created_at
    limit open_slots
    for update skip locked
  )
  update public.specialist_tasks as task
  set status = 'running',
      started_at = coalesce(task.started_at, now()),
      attempts = task.attempts + 1
  from next_jobs
  where task.id = next_jobs.id
  returning task.*;
end;
$$;

revoke all on function public.claim_specialist_tasks(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_specialist_tasks(uuid, integer) to service_role;

revoke all on function public.claim_agent_tasks(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_agent_tasks(uuid, integer) to service_role;
