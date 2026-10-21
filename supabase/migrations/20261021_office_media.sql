-- Owner media and reusable assets. Links, creatives, copy, and anything already used or planned.
-- Service role on avaskye.online writes them. Customers cannot read them.

create table if not exists public.office_media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'copy', 'creative', 'document', 'other')),
  title text not null,
  url text not null default '',
  notes text not null default '',
  status text not null default 'planned' check (status in ('planned', 'used', 'archived')),
  product_key text not null default 'digimark101',
  used_on date,
  created_at timestamptz not null default now()
);

alter table public.office_media enable row level security;

drop policy if exists office_media_owner on public.office_media;
create policy office_media_owner on public.office_media
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

create index if not exists office_media_product_idx on public.office_media (product_key, created_at desc);
create index if not exists office_media_status_idx on public.office_media (status);
