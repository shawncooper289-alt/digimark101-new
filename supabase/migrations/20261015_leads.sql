-- Public project notes from the marketing site.
-- Inserts are made with the service role key, which bypasses row level security.
-- There is no anon insert policy on purpose.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  website text,
  service text,
  budget text,
  message text not null,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create index if not exists leads_created_at_idx on public.leads (created_at desc);
