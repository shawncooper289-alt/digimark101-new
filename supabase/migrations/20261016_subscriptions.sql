-- PayPal memberships. The webhook writes with the service role, which bypasses row level security.
-- A signed-in client can read only the row linked to auth.uid(). Other clients cannot see it.
-- owner_id stays null until checkout included that user's id.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  paypal_subscription_id text not null unique,
  paypal_plan_id text,
  plan_key text,
  status text not null,
  payer_email text,
  payer_id text,
  currency text not null default 'USD',
  amount_value numeric(12, 2),
  interval_count integer,
  last_payment_amount numeric(12, 2),
  last_payment_at timestamptz,
  next_billing_time timestamptz,
  activated_at timestamptz,
  cancelled_at timestamptz,
  last_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = owner_id);

revoke all on public.subscriptions from anon;
grant select on public.subscriptions to authenticated;

create index if not exists subscriptions_owner_idx on public.subscriptions (owner_id);
