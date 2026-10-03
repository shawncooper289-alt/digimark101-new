-- Run in the Supabase SQL editor after reviewing. No service role needed by app.
create table if not exists public.ava_documents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(title) between 1 and 160), content text not null check (length(content) between 1 and 12000),
 indexed boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.ava_workspace_messages (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz not null default now()
);
alter table public.ava_documents enable row level security;
alter table public.ava_workspace_messages enable row level security;
create policy documents_owner on public.ava_documents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy messages_owner on public.ava_workspace_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.ava_documents to authenticated;
grant select, insert on public.ava_workspace_messages to authenticated;
create index if not exists ava_documents_owner_idx on public.ava_documents(user_id, created_at desc);
create index if not exists ava_workspace_messages_owner_idx on public.ava_workspace_messages(user_id, created_at desc);
