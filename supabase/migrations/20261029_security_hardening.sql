-- Advisor fixes. Safe to re-run. Apply after 20261028_beta_onboarding.sql.
-- Does not change function signatures.
--
-- social_account_status was a security-definer view, so it read platform_tokens
-- as the view owner and skipped RLS. It is recreated as security_invoker.
-- Studio (/studio/social) selects that view as the signed-in user. The office
-- reads status columns with the service role, which bypasses RLS.
-- Token columns stay ungranted to anon and authenticated.
--
-- ava_brand_context, ava_memory_store, and ava_voice_calls are per user_id.
-- The app does not query them today. Policies match ava_conversations:
-- the row's user and is_owner(). None of these tables has workspace_id.
--
-- leads holds contact-form PII. Only is_owner() may select. Anon has no grant.
-- Authenticated cannot insert. The service role writes.

-- 1. Invoker view. A stored flag lets the view avoid reading access_token.
alter table public.platform_tokens
  add column if not exists connected boolean
  generated always as ((access_token is not null) and (access_token <> '')) stored;

create or replace view public.social_account_status
with (security_invoker = true) as
select
  user_id,
  platform,
  platform_account_name,
  platform_user_id,
  token_expires_at,
  scopes,
  updated_at,
  connected
from public.platform_tokens
where auth.uid() = user_id or public.is_owner();

alter view public.social_account_status set (security_invoker = true);

revoke all on public.platform_tokens from public, anon, authenticated;
grant select (
  user_id,
  platform,
  platform_account_name,
  platform_user_id,
  token_expires_at,
  scopes,
  updated_at,
  connected
) on public.platform_tokens to authenticated;
grant select, insert, update, delete on public.platform_tokens to service_role;

alter table public.platform_tokens enable row level security;
drop policy if exists platform_tokens_select on public.platform_tokens;
create policy platform_tokens_select on public.platform_tokens
  for select to authenticated
  using (public.is_owner() or auth.uid() = user_id);

revoke all on public.social_account_status from public, anon;
grant select on public.social_account_status to authenticated, service_role;

-- 2. Pin search_path. Argument names stay as they are.
alter function public.is_owner() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
alter function public.update_platform_tokens_updated_at() set search_path = public;

-- Hosted only. 20261025_white_label_instances is not in this repo.
-- Signature on the live database: is_instance_owner(instance_id uuid).
do $$
begin
  if to_regprocedure('public.is_instance_owner(uuid)') is not null then
    execute 'alter function public.is_instance_owner(uuid) set search_path = public';
  end if;
end $$;

-- 3. Trigger function. initial_schema.sql sorts after this file and creates
-- handle_new_user, so skip when it is not here yet. That later file revokes
-- the same grants after it creates the function. Signup still runs as
-- supabase_auth_admin, which is not anon or authenticated.
do $$
begin
  if to_regprocedure('public.handle_new_user()') is null then
    return;
  end if;
  execute 'revoke all on function public.handle_new_user() from public, anon, authenticated';
  execute 'grant execute on function public.handle_new_user() to service_role';
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;
end $$;

-- 4. Policies for tables that had RLS and no policy.
-- The three Ava tables are created in initial_schema.sql, which sorts later.
-- This block runs when they already exist (hosted, or a second apply).
-- initial_schema.sql repeats these policies after it creates the tables.
alter table public.leads enable row level security;
revoke all on public.leads from public, anon, authenticated;
grant select on public.leads to authenticated;
grant select, insert, update, delete on public.leads to service_role;

drop policy if exists leads_owner_select on public.leads;
create policy leads_owner_select on public.leads
  for select to authenticated
  using (public.is_owner());

do $$
declare
  tbl text;
begin
  foreach tbl in array array['ava_brand_context', 'ava_memory_store', 'ava_voice_calls']
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from public, anon', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_access', tbl);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_owner() or auth.uid() = user_id) with check (public.is_owner() or auth.uid() = user_id)',
      tbl || '_access',
      tbl
    );
  end loop;
end $$;
