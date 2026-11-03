-- Mail sequences and per-account media. The founder account and every client get the same two stores.
-- Service role on avaskye.online writes them. Customers cannot read them.

alter table public.office_media add column if not exists account_id uuid;

create index if not exists office_media_account_idx on public.office_media (account_id, created_at desc);

create table if not exists public.office_sequences (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  product_key text not null default 'digimark101',
  name text not null,
  steps text not null default '',
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.office_sequences enable row level security;

drop policy if exists office_sequences_owner on public.office_sequences;
create policy office_sequences_owner on public.office_sequences
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create index if not exists office_sequences_account_idx on public.office_sequences (account_id, created_at desc);
