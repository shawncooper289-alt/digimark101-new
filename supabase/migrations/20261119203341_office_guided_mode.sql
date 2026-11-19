-- Guided mode for the owner office.
-- One flag on the existing appearance row. Do not apply this file to the live
-- project until the owner approves it. The app keeps the toggle in the browser
-- when this column is not there yet.
--
-- RLS is already enabled on public.owner_office_appearance.
-- The policies below are the same row rules as 20261017_office_appearance.sql.
-- They cover the new column because policies are row-level, not column-level.
-- Authenticated owners can read and write only their own row, and only when
-- public.is_owner() is true. anon and public have no privileges.

alter table public.owner_office_appearance
  add column if not exists guided_mode boolean not null default false;

comment on column public.owner_office_appearance.guided_mode is
  'When true, Ava walks the signed-in owner through the current office page.';

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
