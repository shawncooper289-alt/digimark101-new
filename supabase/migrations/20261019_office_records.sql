-- Owner books. Invoices, expenses, and office records live here.
-- The service role on avaskye.online writes them. Customers cannot read them.

create table if not exists public.office_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'expense', 'record', 'legal')),
  title text not null,
  party text not null default '',
  amount numeric(12, 2),
  currency text not null default 'USD',
  status text not null default 'open' check (status in ('open', 'paid', 'filed')),
  notes text not null default '',
  occurred_on date,
  product_key text not null default 'digimark101',
  created_at timestamptz not null default now()
);

alter table public.office_records enable row level security;

drop policy if exists office_records_owner on public.office_records;
create policy office_records_owner on public.office_records
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create index if not exists office_records_kind_idx on public.office_records (kind, created_at desc);
