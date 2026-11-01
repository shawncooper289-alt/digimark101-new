-- profiles.role stayed 'member' for the owner because mark_owner_profile
-- (AFTER INSERT) ran before handle_new_user and updated zero rows.
-- The profile insert then used the column default.
-- Safe to re-run. Does not store an email address.

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

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;
end $$;

-- Name sorts after on_auth_user_created, so the profile row exists first.
drop trigger if exists mark_owner_profile on auth.users;
drop trigger if exists z_mark_owner_profile on auth.users;
create trigger z_mark_owner_profile
  after insert or update of email on auth.users
  for each row execute function private.mark_owner_profile();

do $$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    return;
  end if;
  update public.profiles p
  set role = 'owner'
  from auth.users u
  where u.id = p.id
    and coalesce(p.role, '') is distinct from 'owner'
    and (
      coalesce(u.raw_app_meta_data ->> 'role', '') = 'owner'
      or (
        to_regclass('private.owner_settings') is not null
        and exists (
          select 1 from private.owner_settings s
          where s.key = 'owner_email'
            and lower(s.value) = lower(coalesce(u.email, ''))
        )
      )
    );
end $$;
