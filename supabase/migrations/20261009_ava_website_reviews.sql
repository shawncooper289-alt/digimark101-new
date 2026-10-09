create table public.ava_website_reviews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 source_url text not null, findings text not null, truncated boolean not null default false,
 confirmed_at timestamptz, created_at timestamptz not null default now()
);
alter table public.ava_website_reviews enable row level security;
revoke all on public.ava_website_reviews from anon;
grant select, insert, update, delete on public.ava_website_reviews to authenticated;
create policy website_owner on public.ava_website_reviews for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index website_owner_date on public.ava_website_reviews(user_id, created_at desc);
