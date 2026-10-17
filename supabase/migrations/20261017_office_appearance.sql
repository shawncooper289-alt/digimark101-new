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
