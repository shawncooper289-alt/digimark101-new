-- Owner role. The mailbox itself is not stored in this file.
-- The server reads OWNER_EMAIL and calls sync_owner_email, which writes the
-- address into private.owner_settings and stamps matching auth users with
-- app_metadata.role = owner. A trigger does the same on later signups.

create schema if not exists private;

create table if not exists private.owner_settings (
  key text primary key,
  value text not null
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.owner_settings from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on table private.owner_settings to service_role;

do $$
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles add column if not exists role text default 'member';
  end if;
end $$;

create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner';
$$;

create or replace function private.mark_owner_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  owner_email text;
begin
  select value into owner_email from private.owner_settings where key = 'owner_email';
  if owner_email is not null and lower(coalesce(new.email, '')) = lower(owner_email) then
    new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'owner');
  end if;
  return new;
end;
$$;

drop trigger if exists mark_owner_metadata on auth.users;
create trigger mark_owner_metadata
  before insert or update of email on auth.users
  for each row execute function private.mark_owner_metadata();

create or replace function private.mark_owner_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  owner_email text;
begin
  if to_regclass('public.profiles') is null then
    return new;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    return new;
  end if;
  select value into owner_email from private.owner_settings where key = 'owner_email';
  if owner_email is not null and lower(coalesce(new.email, '')) = lower(owner_email) then
    update public.profiles set role = 'owner' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists mark_owner_profile on auth.users;
create trigger mark_owner_profile
  after insert or update of email on auth.users
  for each row execute function private.mark_owner_profile();

create or replace function public.sync_owner_email(owner_email text)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  clean text := lower(trim(coalesce(owner_email, '')));
begin
  if clean = '' or position('@' in clean) = 0 then
    raise exception 'invalid owner email';
  end if;
  insert into private.owner_settings (key, value)
  values ('owner_email', clean)
  on conflict (key) do update set value = excluded.value;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'owner')
  where lower(email) = clean
    and coalesce(raw_app_meta_data ->> 'role', '') is distinct from 'owner';

  if to_regclass('public.profiles') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
     ) then
    update public.profiles set role = 'owner' where lower(email) = clean;
  end if;
end;
$$;

revoke all on function public.sync_owner_email(text) from public, anon, authenticated;
grant execute on function public.sync_owner_email(text) to service_role;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'contacts', 'deals', 'appointments', 'threads', 'thread_messages',
    'campaigns', 'sites', 'automations', 'client_memory', 'client_files'
  ]
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    execute format('drop policy if exists %I_own on public.%I', tbl, tbl);
    execute format(
      'create policy %I_own on public.%I for all to authenticated using (auth.uid() = owner_id or public.is_owner()) with check (auth.uid() = owner_id or public.is_owner())',
      tbl,
      tbl
    );
  end loop;
end $$;

drop policy if exists client_files_read on storage.objects;
drop policy if exists client_files_write on storage.objects;
drop policy if exists client_files_update on storage.objects;
drop policy if exists client_files_delete on storage.objects;

create policy client_files_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );

create policy client_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_owner()
    )
  );
