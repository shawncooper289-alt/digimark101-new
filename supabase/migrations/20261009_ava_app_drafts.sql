create table public.ava_app_drafts (
 user_id uuid not null references auth.users(id) on delete cascade, app text not null,
 config jsonb not null check (jsonb_typeof(config) = 'object'), updated_at timestamptz not null default now(),
 primary key (user_id, app)
);
alter table public.ava_app_drafts enable row level security;
revoke all on public.ava_app_drafts from anon;
grant select,insert,update,delete on public.ava_app_drafts to authenticated;
create policy app_draft_owner on public.ava_app_drafts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
