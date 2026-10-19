-- Every office row belongs to one product. DigiMark101 is the first.
-- A later Ava Skye product uses its own key and does not mix into this one.

alter table public.campaigns add column if not exists product_key text not null default 'digimark101';
create index if not exists campaigns_product_idx on public.campaigns (product_key);

alter table public.office_records add column if not exists product_key text not null default 'digimark101';
create index if not exists office_records_product_idx on public.office_records (product_key);
