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

-- Ava is canonical by default. White-label media requires a reviewable exception.
create type public.ava_identity_mode as enum ('canonical', 'white_label_pending', 'white_label_approved');
alter table public.workspaces add column ava_identity_mode public.ava_identity_mode not null default 'canonical';
create table public.white_label_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  sales_use_case text not null check (char_length(sales_use_case) between 20 and 2000),
  requested_avatar_asset text,
  requested_voice_asset text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'revoked')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.white_label_requests enable row level security;
create policy "workspace owners view white label requests" on public.white_label_requests for select using (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));
create policy "workspace owners request white label review" on public.white_label_requests for insert with check (exists (select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()) and requested_by = auth.uid() and status = 'pending');
-- There is deliberately no client update policy. Approval, rejection, revocation, and identity-mode changes must run through a privileged audited admin workflow.
