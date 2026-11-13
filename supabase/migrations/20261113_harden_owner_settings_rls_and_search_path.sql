-- Exact SQL from live migration harden_owner_settings_rls_and_search_path
-- (supabase_migrations.schema_migrations version 20261113042525).
-- Already applied on project sdjbvdujcmfmdjfolmhv. Safe to re-run.

-- Lock private.owner_settings with row-level security. Only the server (service_role)
-- and the postgres-owned SECURITY DEFINER owner functions read or write it.
alter table private.owner_settings enable row level security;
drop policy if exists owner_settings_service_role on private.owner_settings;
create policy owner_settings_service_role on private.owner_settings
  for all to service_role using (true) with check (true);
revoke all on table private.owner_settings from public, anon, authenticated;

-- Pin search_path on private.owner_emails (body is fully schema-qualified).
alter function private.owner_emails() set search_path = '';
revoke execute on function private.owner_emails() from public, anon, authenticated;
