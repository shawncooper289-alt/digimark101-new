-- Owner office access. Full lead PII and billing oversight are readable by the
-- owner role (app_metadata.role = owner) and by the service role Ava uses on
-- the server. Signed-in customers and the anon key stay denied.

grant select, update on public.lead_private_contacts to authenticated;
grant select on public.lead_staging to authenticated;
grant select on public.lead_rejected to authenticated;
grant select on public.lead_suppressions to authenticated;
grant select on public.lead_orders to authenticated;
grant select on public.lead_releases to authenticated;

drop policy if exists lead_private_owner_select on public.lead_private_contacts;
create policy lead_private_owner_select on public.lead_private_contacts
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_private_owner_update on public.lead_private_contacts;
create policy lead_private_owner_update on public.lead_private_contacts
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists lead_staging_owner_select on public.lead_staging;
create policy lead_staging_owner_select on public.lead_staging
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_rejected_owner_select on public.lead_rejected;
create policy lead_rejected_owner_select on public.lead_rejected
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_suppressions_owner_select on public.lead_suppressions;
create policy lead_suppressions_owner_select on public.lead_suppressions
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_orders_owner_select on public.lead_orders;
create policy lead_orders_owner_select on public.lead_orders
  for select to authenticated
  using (public.is_owner());

drop policy if exists lead_releases_owner_select on public.lead_releases;
create policy lead_releases_owner_select on public.lead_releases
  for select to authenticated
  using (public.is_owner());

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions
  for select to authenticated
  using (public.is_owner());
