-- One-time store orders for appdm101.store.
-- Additive only. Does not change PayPal plans, paypal_plans, or subscriptions.
-- The owner applies this file. The app does not run it.

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  title text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  buyer_id uuid references auth.users (id) on delete set null,
  buyer_email text not null default '',
  workspace_id uuid references public.workspaces (id) on delete set null,
  paypal_order_id text unique,
  paypal_capture_id text unique,
  delivery text not null default '',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.store_order_notices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders (id) on delete cascade,
  kind text not null check (kind in ('buyer', 'owner')),
  channel text not null check (channel in ('page', 'email')),
  status text not null default 'sent' check (status in ('pending', 'sent', 'skipped')),
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique (order_id, kind)
);

create table if not exists public.store_lead_deliveries (
  lead_id uuid primary key references public.lead_records (id) on delete cascade,
  order_id uuid not null references public.store_orders (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid not null references public.store_orders (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null,
  created_at timestamptz not null default now(),
  unique (order_id)
);

create index if not exists store_orders_buyer_idx on public.store_orders (buyer_id);
create index if not exists store_orders_workspace_idx on public.store_orders (workspace_id);
create index if not exists store_orders_email_idx on public.store_orders (buyer_email);
create index if not exists store_orders_created_idx on public.store_orders (created_at desc);
create index if not exists store_order_notices_order_idx on public.store_order_notices (order_id);
create index if not exists store_lead_deliveries_order_idx on public.store_lead_deliveries (order_id);
create index if not exists credit_ledger_owner_idx on public.credit_ledger (owner_id, created_at desc);
create index if not exists credit_ledger_workspace_idx on public.credit_ledger (workspace_id);

alter table public.store_orders enable row level security;
alter table public.store_order_notices enable row level security;
alter table public.store_lead_deliveries enable row level security;
alter table public.credit_ledger enable row level security;

drop policy if exists store_orders_select on public.store_orders;
create policy store_orders_select on public.store_orders
  for select to authenticated
  using (
    buyer_id = (select auth.uid())
    or (select public.is_owner())
  );

drop policy if exists store_order_notices_select on public.store_order_notices;
create policy store_order_notices_select on public.store_order_notices
  for select to authenticated
  using ((select public.is_owner()));

drop policy if exists store_lead_deliveries_select on public.store_lead_deliveries;
create policy store_lead_deliveries_select on public.store_lead_deliveries
  for select to authenticated
  using ((select public.is_owner()));

drop policy if exists credit_ledger_select on public.credit_ledger;
create policy credit_ledger_select on public.credit_ledger
  for select to authenticated
  using ((select public.can_access_workspace(workspace_id, owner_id)));

revoke all on public.store_orders from anon, public, authenticated;
revoke all on public.store_order_notices from anon, public, authenticated;
revoke all on public.store_lead_deliveries from anon, public, authenticated;
revoke all on public.credit_ledger from anon, public, authenticated;

grant select on public.store_orders to authenticated;
grant select on public.store_order_notices to authenticated;
grant select on public.store_lead_deliveries to authenticated;
grant select on public.credit_ledger to authenticated;

grant select, insert, update, delete on public.store_orders to service_role;
grant select, insert, update, delete on public.store_order_notices to service_role;
grant select, insert, update, delete on public.store_lead_deliveries to service_role;
grant select, insert, update, delete on public.credit_ledger to service_role;
