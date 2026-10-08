-- Review and apply in Supabase SQL Editor; not applied by a Vercel deployment.
begin;
-- Prevent client-controlled subscription/entitlement changes.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, company_name, phone, onboarding_completed) on public.profiles to authenticated;
-- A message must belong to a conversation owned by the authenticated user.
drop policy if exists "Users can insert own messages" on public.ava_messages;
create policy "Users can insert own messages" on public.ava_messages
for insert to authenticated with check (
 user_id = (select auth.uid()) and exists (
  select 1 from public.ava_conversations c
  where c.id = conversation_id and c.user_id = (select auth.uid())
 )
);
-- Fix the security-definer search path and qualify object references.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles (id, email, full_name, avatar_url)
 values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
 return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
commit;
