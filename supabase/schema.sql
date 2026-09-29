-- Run in the Supabase SQL editor before enabling persistence.
create type public.ava_mode as enum ('guided', 'self_directed');
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  ava_mode public.ava_mode not null default 'guided',
  first_goal text,
  created_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
create policy "owners manage their workspaces" on public.workspaces for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create table public.ava_tasks (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null, assigned_agent text not null default 'ava', completion_criteria text, status text not null default 'proposed' check (status in ('proposed','approved','running','ready_for_review','completed','blocked')),
  requires_approval boolean not null default true, created_at timestamptz not null default now()
);
alter table public.ava_tasks enable row level security;
create policy "workspace owners manage tasks" on public.ava_tasks for all using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
