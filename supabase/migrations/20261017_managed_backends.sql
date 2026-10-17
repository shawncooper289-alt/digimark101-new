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
