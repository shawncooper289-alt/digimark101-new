-- Lead marketplace prices, published offer columns, and the workspace product catalog.
-- Additive only. Does not change PayPal plans, paypal_plans, or subscriptions.
-- Apply 20261119_feature_parity.sql and 20261120_store_orders.sql first.
-- The owner applies this file. The app does not run it.

do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Apply 20261119_feature_parity.sql before 20261121_sales_surfaces.sql';
  end if;
  if to_regclass('public.store_orders') is null then
    raise exception 'Apply 20261120_store_orders.sql before 20261121_sales_surfaces.sql';
  end if;
end $$;

alter table public.products add column if not exists slug text;
alter table public.products add column if not exists kind text;
update public.products set kind = 'one_time' where kind is null or btrim(kind) = '';
alter table public.products alter column kind set default 'one_time';
alter table public.products alter column kind set not null;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists credits integer not null default 0;
alter table public.products add column if not exists prompt_body text not null default '';
alter table public.products add column if not exists published boolean not null default false;

do $$
begin
  alter table public.products add constraint products_kind_check check (kind in ('token', 'prompt_pack', 'one_time'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.products add constraint products_credits_check check (credits >= 0);
exception when duplicate_object then null;
end $$;

create unique index if not exists products_slug_unique on public.products (slug) where slug is not null and slug <> '';

alter table public.funnels add column if not exists slug text;
alter table public.funnels add column if not exists surface text;
alter table public.funnels add column if not exists offer_kind text;

do $$
begin
  alter table public.funnels add constraint funnels_offer_kind_check
    check (offer_kind is null or offer_kind in ('upsell', 'bump', 'upgrade'));
exception when duplicate_object then null;
end $$;

alter table public.funnel_pages add column if not exists body text not null default '';
alter table public.funnel_pages add column if not exists cta text not null default '';
alter table public.funnel_pages add column if not exists amount_cents integer;

do $$
begin
  alter table public.funnel_pages add constraint funnel_pages_amount_check check (amount_cents is null or amount_cents >= 0);
exception when duplicate_object then null;
end $$;

create unique index if not exists funnels_ink_slug_unique on public.funnels (slug) where surface = 'ink' and slug is not null and slug <> '';

alter table public.store_orders add column if not exists detail jsonb not null default '{}'::jsonb;

create table if not exists public.lead_niche_prices (
  niche_key text primary key references public.lead_niches (key) on update cascade,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  pack_size integer not null default 25 check (pack_size between 1 and 500),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.store_orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists prompt_entitlements_owner_idx on public.prompt_entitlements (owner_id, created_at desc);
create index if not exists prompt_entitlements_order_idx on public.prompt_entitlements (order_id);
create index if not exists prompt_entitlements_product_idx on public.prompt_entitlements (product_id);
create index if not exists prompt_entitlements_workspace_idx on public.prompt_entitlements (workspace_id);

alter table public.lead_niche_prices enable row level security;
alter table public.prompt_entitlements enable row level security;

drop policy if exists lead_niche_prices_read on public.lead_niche_prices;
create policy lead_niche_prices_read on public.lead_niche_prices
  for select to anon, authenticated
  using (true);

drop policy if exists lead_niche_prices_write on public.lead_niche_prices;
create policy lead_niche_prices_write on public.lead_niche_prices
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists prompt_entitlements_select on public.prompt_entitlements;
create policy prompt_entitlements_select on public.prompt_entitlements
  for select to authenticated
  using ((select public.can_access_workspace(workspace_id, owner_id)));

revoke all on public.lead_niche_prices from anon, public, authenticated;
revoke all on public.prompt_entitlements from anon, public, authenticated;

grant select on public.lead_niche_prices to anon, authenticated;
grant insert, update, delete on public.lead_niche_prices to authenticated;
grant select on public.prompt_entitlements to authenticated;

grant select, insert, update, delete on public.lead_niche_prices to service_role;
grant select, insert, update, delete on public.prompt_entitlements to service_role;
