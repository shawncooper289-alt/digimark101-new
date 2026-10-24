-- Seats sold through PayPal, requested from the pricing form, or granted in the office.
-- Safe to re-run. Service role is the only writer. The project ref is never stored here.

create table if not exists public.seats (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  plan_key text not null default 'monthly',
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  source text not null check (source in ('paypal', 'manual', 'request')),
  paypal_subscription_id text,
  granted_by uuid,
  invite_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists seats_open_email_idx
  on public.seats (lower(email))
  where status in ('pending', 'active');

create index if not exists seats_user_idx on public.seats (user_id);
create index if not exists seats_paypal_idx on public.seats (paypal_subscription_id);

create or replace function public.deliver_seat(
  seat_email text,
  seat_plan text,
  seat_source text,
  seat_user uuid default null,
  seat_paypal text default null,
  seat_granted_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  found_user uuid;
  ws uuid;
  seat_id uuid;
  next_status text;
begin
  if seat_user is not null and nullif(trim(coalesce(seat_email, '')), '') is null then
    select email into seat_email from auth.users where id = seat_user;
  end if;
  seat_email := lower(trim(coalesce(seat_email, '')));
  if seat_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'error', 'email');
  end if;
  if seat_plan not in ('starter', 'monthly', 'quarterly', 'semiannual') then
    seat_plan := 'monthly';
  end if;
  if seat_source not in ('paypal', 'manual', 'request') then
    return jsonb_build_object('ok', false, 'error', 'source');
  end if;

  select id into found_user
  from auth.users
  where (seat_user is not null and id = seat_user)
     or lower(email) = seat_email
  order by case when seat_user is not null and id = seat_user then 0 else 1 end
  limit 1;

  insert into public.seats (email, plan_key, source, status, user_id, paypal_subscription_id, granted_by)
  values (
    seat_email,
    seat_plan,
    seat_source,
    'pending',
    found_user,
    nullif(trim(coalesce(seat_paypal, '')), ''),
    seat_granted_by
  )
  on conflict ((lower(email))) where status in ('pending', 'active')
  do update set
    plan_key = excluded.plan_key,
    source = excluded.source,
    user_id = coalesce(excluded.user_id, public.seats.user_id),
    paypal_subscription_id = coalesce(excluded.paypal_subscription_id, public.seats.paypal_subscription_id),
    granted_by = coalesce(excluded.granted_by, public.seats.granted_by),
    updated_at = now()
  returning id into seat_id;

  next_status := 'pending';
  if found_user is not null and seat_source in ('paypal', 'manual') then
    select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
    if ws is null then
      insert into public.workspaces (owner_id, name, personal)
      values (found_user, 'Personal', true)
      on conflict (owner_id) where personal do nothing
      returning id into ws;
      if ws is null then
        select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
      end if;
      insert into public.workspace_members (workspace_id, user_id, role)
      values (ws, found_user, 'owner')
      on conflict (workspace_id, user_id) do nothing;
    end if;
    next_status := 'active';
    update public.seats
    set user_id = found_user, workspace_id = ws, status = 'active', updated_at = now()
    where id = seat_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'seat_id', seat_id,
    'user_id', found_user,
    'workspace_id', ws,
    'status', next_status,
    'email', seat_email
  );
end;
$$;

revoke all on function public.deliver_seat(text, text, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_seat(text, text, text, uuid, text, uuid) to service_role;

alter table public.seats enable row level security;

drop policy if exists seats_select on public.seats;
create policy seats_select on public.seats
  for select to authenticated
  using (public.is_owner() or auth.uid() = user_id);

revoke all on public.seats from anon;
grant select on public.seats to authenticated;
grant select, insert, update, delete on public.seats to service_role;
