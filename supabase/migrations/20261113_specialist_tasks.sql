-- Internal helper log. Clients cannot read it. The owner can.
-- At most 6 tasks per workspace are marked running. The rest stay queued.

create table if not exists public.specialist_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('copywriter', 'social', 'ads', 'seo', 'followup', 'research')),
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  brief text not null,
  result text,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists specialist_tasks_owner_status_idx
  on public.specialist_tasks (owner_id, status, created_at);

alter table public.specialist_tasks enable row level security;
revoke all on public.specialist_tasks from public, anon, authenticated;
grant select, update on public.specialist_tasks to authenticated;
grant select, insert, update, delete on public.specialist_tasks to service_role;

drop policy if exists specialist_tasks_owner_select on public.specialist_tasks;
create policy specialist_tasks_owner_select on public.specialist_tasks
  for select to authenticated
  using (public.is_owner());

drop policy if exists specialist_tasks_owner_update on public.specialist_tasks;
create policy specialist_tasks_owner_update on public.specialist_tasks
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

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
  where owner_id = p_owner and status = 'running';
  open_slots := least(open_slots, greatest(coalesce(p_limit, 0), 0));
  if open_slots <= 0 then
    return;
  end if;
  return query
  with next_jobs as (
    select id
    from public.specialist_tasks
    where owner_id = p_owner and status = 'queued'
    order by created_at
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

revoke all on function public.claim_specialist_tasks(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_specialist_tasks(uuid, integer) to service_role;
