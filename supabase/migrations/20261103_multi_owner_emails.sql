-- Multi-owner support.
-- Stores a comma-separated list of owner emails in private.owner_settings
-- under the key 'owner_emails'. Any matching email is stamped as owner.
-- Safe to re-run.

create or replace function private.owner_emails()
returns text[]
language sql
stable
as $$
  select string_to_array(
    lower(coalesce((select value from private.owner_settings where key = 'owner_emails'), '')),
    ','
  );
$$;

create or replace function private.mark_owner_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
begin
  if lower(coalesce(new.email, '')) = any(private.owner_emails()) then
    new.raw_app_meta_data = coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'owner');
  end if;
  return new;
end;
$$;

create or replace function private.mark_owner_profile()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
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

  if lower(coalesce(new.email, '')) = any(private.owner_emails()) then
    update public.profiles set role = 'owner' where id = new.id;
  end if;
  return new;
end;
$$;

create or replace function public.sync_owner_emails(owner_emails text)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  clean text := lower(trim(coalesce(owner_emails, '')));
  owner_email text;
begin
  if clean = '' then
    raise exception 'owner_emails cannot be empty';
  end if;

  insert into private.owner_settings (key, value)
  values ('owner_emails', clean)
  on conflict (key) do update set value = excluded.value;

  foreach owner_email in array string_to_array(clean, ',')
  loop
    owner_email := trim(owner_email);
    if owner_email = '' or position('@' in owner_email) = 0 then
      continue;
    end if;

    update auth.users as u
    set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'owner')
    where lower(u.email) = owner_email
      and coalesce(u.raw_app_meta_data ->> 'role', '') is distinct from 'owner';

    if to_regclass('public.profiles') is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
       ) then
      update public.profiles as p set role = 'owner' where lower(p.email) = owner_email;
    end if;
  end loop;
end;
$$;

revoke all on function public.sync_owner_emails(text) from public, anon, authenticated;
grant execute on function public.sync_owner_emails(text) to service_role;

-- Update handle_new_user to also check the multi-owner list
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text := 'member';
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') = 'owner'
     or lower(coalesce(new.email, '')) = any(private.owner_emails())
     or (
       to_regclass('private.owner_settings') is not null
       and exists (
         select 1 from private.owner_settings s
         where s.key = 'owner_email'
           and lower(s.value) = lower(coalesce(new.email, ''))
       )
     ) then
    next_role := 'owner';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    next_role
  )
  on conflict (id) do update
    set role = excluded.role
    where excluded.role = 'owner';
  return new;
end;
$$;

-- Apply the four owner emails immediately
select public.sync_owner_emails(
  'digimark101@mail.com,digimark101s@gmail.com,shawncooper289@gmail.com,earndaily101@mail.com'
);
