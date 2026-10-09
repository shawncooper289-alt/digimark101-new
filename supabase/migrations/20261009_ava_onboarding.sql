-- Review/apply in staging before activation. One private personal workspace per authenticated user.
create table if not exists public.ava_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null check (mode in ('guided', 'self-directed')),
  brief jsonb not null check (jsonb_typeof(brief) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.ava_onboarding enable row level security;
revoke all on public.ava_onboarding from anon;
grant select, insert, update, delete on public.ava_onboarding to authenticated;
create policy "onboarding_owner_select" on public.ava_onboarding for select to authenticated using (auth.uid() = user_id);
create policy "onboarding_owner_insert" on public.ava_onboarding for insert to authenticated with check (auth.uid() = user_id);
create policy "onboarding_owner_update" on public.ava_onboarding for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "onboarding_owner_delete" on public.ava_onboarding for delete to authenticated using (auth.uid() = user_id);
