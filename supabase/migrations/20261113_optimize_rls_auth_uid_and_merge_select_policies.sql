-- Exact SQL from live migration optimize_rls_auth_uid_and_merge_select_policies
-- (supabase_migrations.schema_migrations version 20261113042556).
-- Already applied on project sdjbvdujcmfmdjfolmhv. Safe to re-run:
-- policies that already wrap auth.uid() are skipped.

-- 1) Merge duplicate SELECT policies (same access, one policy).
drop policy if exists lead_orders_owner_select on public.lead_orders;
drop policy if exists lead_orders_select_own on public.lead_orders;
create policy lead_orders_select on public.lead_orders
  for select to authenticated
  using (public.is_owner() or (select auth.uid()) = buyer_id);

drop policy if exists subscriptions_owner_select on public.subscriptions;
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (public.is_owner() or (select auth.uid()) = owner_id);

-- 2) Evaluate auth.uid() once per query instead of once per row.
--    Same rules, same results; only wraps auth.uid() in (select ...).
do $$
declare
  p record;
  q text;
  c text;
  stmt text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%auth.uid()%' or coalesce(with_check, '') like '%auth.uid()%')
      and coalesce(qual, '') not like '%SELECT auth.uid()%'
      and coalesce(with_check, '') not like '%SELECT auth.uid()%'
  loop
    q := replace(p.qual, 'auth.uid()', '(select auth.uid())');
    c := replace(p.with_check, 'auth.uid()', '(select auth.uid())');
    stmt := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    if q is not null then stmt := stmt || ' using (' || q || ')'; end if;
    if c is not null then stmt := stmt || ' with check (' || c || ')'; end if;
    execute stmt;
  end loop;
end $$;
