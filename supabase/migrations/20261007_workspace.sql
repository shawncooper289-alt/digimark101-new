-- Apply through your connected Supabase project's SQL Editor.
create table if not exists public.digimark_workspace (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('Studio','Contacts','Pipeline','Funnels','YouTube','Pages')),
 title text not null check (char_length(title) between 1 and 200),
 content text not null check (char_length(content) between 1 and 20000),
 created_at timestamptz not null default now()
);
alter table public.digimark_workspace enable row level security;
drop policy if exists "workspace_owner" on public.digimark_workspace;
create policy "workspace_owner" on public.digimark_workspace for all to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.digimark_workspace to authenticated;
revoke all on public.digimark_workspace from anon;
create index if not exists workspace_owner_kind on public.digimark_workspace(user_id,kind,created_at desc);
