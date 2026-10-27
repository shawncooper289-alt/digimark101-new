-- Beta seats, owner-visible feedback, and anonymized onboarding outcomes.
-- Safe to re-run. Apply after 20261027_media_business_builds.sql.
-- A beta seat is free: source beta, is_beta true, no PayPal id.
-- client_onboarding stays readable only by the signed-in user.

alter table public.seats add column if not exists is_beta boolean not null default false;
alter table public.seats add column if not exists beta_consent_at timestamptz;
alter table public.workspaces add column if not exists is_beta boolean not null default false;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.seats'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%paypal%'
      and pg_get_constraintdef(oid) ilike '%manual%'
  loop
    execute format('alter table public.seats drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.seats drop constraint if exists seats_source_check;
alter table public.seats
  add constraint seats_source_check
  check (source in ('paypal', 'manual', 'request', 'beta'));

create index if not exists seats_beta_idx on public.seats (is_beta, status);

alter table public.client_onboarding
  add column if not exists niche text,
  add column if not exists service_area text,
  add column if not exists offer text,
  add column if not exists pricing text,
  add column if not exists target_customer text,
  add column if not exists goals text,
  add column if not exists current_tools text,
  add column if not exists brand_colors text,
  add column if not exists logo_note text,
  add column if not exists booking_hours text,
  add column if not exists lead_sources text,
  add column if not exists compliance_notes text,
  add column if not exists social_profiles text;

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
  seat public.seats%rowtype;
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
  if seat_source not in ('paypal', 'manual', 'request', 'beta') then
    return jsonb_build_object('ok', false, 'error', 'source');
  end if;

  select id into found_user
  from auth.users
  where (seat_user is not null and id = seat_user)
     or lower(email) = seat_email
  order by case when seat_user is not null and id = seat_user then 0 else 1 end
  limit 1;

  insert into public.seats (email, plan_key, source, status, user_id, paypal_subscription_id, granted_by, is_beta)
  values (
    seat_email,
    seat_plan,
    seat_source,
    'pending',
    found_user,
    nullif(trim(coalesce(seat_paypal, '')), ''),
    seat_granted_by,
    seat_source = 'beta'
  )
  on conflict ((lower(email))) where status in ('pending', 'active')
  do update set
    plan_key = case when public.seats.source = 'paypal' then public.seats.plan_key else excluded.plan_key end,
    source = case when public.seats.source = 'paypal' then public.seats.source else excluded.source end,
    is_beta = case
      when public.seats.source = 'paypal' then public.seats.is_beta
      else public.seats.is_beta or excluded.is_beta
    end,
    user_id = coalesce(excluded.user_id, public.seats.user_id),
    paypal_subscription_id = coalesce(excluded.paypal_subscription_id, public.seats.paypal_subscription_id),
    granted_by = coalesce(excluded.granted_by, public.seats.granted_by),
    updated_at = now()
  returning * into seat;

  next_status := seat.status;
  if found_user is not null and seat.source in ('paypal', 'manual', 'beta') then
    select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
    if ws is null then
      insert into public.workspaces (owner_id, name, personal, is_beta)
      values (found_user, 'Personal', true, seat.is_beta)
      on conflict (owner_id) where personal do nothing
      returning id into ws;
      if ws is null then
        select id into ws from public.workspaces where owner_id = found_user and personal limit 1;
      end if;
      insert into public.workspace_members (workspace_id, user_id, role)
      values (ws, found_user, 'owner')
      on conflict (workspace_id, user_id) do nothing;
    end if;
    if seat.is_beta then
      update public.workspaces set is_beta = true where id = ws;
    end if;
    next_status := 'active';
    update public.seats
    set user_id = found_user, workspace_id = ws, status = 'active', updated_at = now()
    where id = seat.id
    returning * into seat;
  end if;

  return jsonb_build_object(
    'ok', true,
    'seat_id', seat.id,
    'user_id', found_user,
    'workspace_id', ws,
    'status', next_status,
    'email', seat_email,
    'is_beta', seat.is_beta
  );
end;
$$;

revoke all on function public.deliver_seat(text, text, text, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.deliver_seat(text, text, text, uuid, text, uuid) to service_role;

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  body text not null,
  page text,
  created_at timestamptz not null default now(),
  constraint beta_feedback_body_check check (char_length(btrim(body)) between 1 and 4000)
);

alter table public.beta_feedback add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;
alter table public.beta_feedback add column if not exists page text;
alter table public.beta_feedback enable row level security;

drop policy if exists beta_feedback_insert on public.beta_feedback;
create policy beta_feedback_insert on public.beta_feedback
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.seats s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and s.is_beta
    )
  );

drop policy if exists beta_feedback_select on public.beta_feedback;
create policy beta_feedback_select on public.beta_feedback
  for select to authenticated
  using (public.is_owner());

revoke all on public.beta_feedback from anon;
grant insert on public.beta_feedback to authenticated;
grant select on public.beta_feedback to authenticated, service_role;
grant insert, update, delete on public.beta_feedback to service_role;

create index if not exists beta_feedback_created_idx on public.beta_feedback (created_at desc);

create or replace function public.submit_beta_feedback(note text, note_page text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'auth');
  end if;
  insert into public.beta_feedback (user_id, body, page)
  values (auth.uid(), note, nullif(btrim(coalesce(note_page, '')), ''));
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_beta_feedback(text, text) from public, anon;
grant execute on function public.submit_beta_feedback(text, text) to authenticated, service_role;

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  outcome text not null,
  niche text,
  created_at timestamptz not null default now(),
  constraint onboarding_sessions_question_check check (char_length(question_id) between 1 and 80),
  constraint onboarding_sessions_outcome_check check (outcome in ('completed', 'skipped', 'corrected')),
  constraint onboarding_sessions_niche_check check (
    niche is null or niche in ('local_service', 'professional', 'ecommerce', 'creator', 'other')
  )
);

alter table public.onboarding_sessions enable row level security;

drop policy if exists onboarding_sessions_insert on public.onboarding_sessions;
create policy onboarding_sessions_insert on public.onboarding_sessions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists onboarding_sessions_select on public.onboarding_sessions;
create policy onboarding_sessions_select on public.onboarding_sessions
  for select to authenticated
  using (public.is_owner());

revoke all on public.onboarding_sessions from anon;
grant insert on public.onboarding_sessions to authenticated;
grant select on public.onboarding_sessions to authenticated, service_role;
grant insert, update, delete on public.onboarding_sessions to service_role;

create index if not exists onboarding_sessions_created_idx on public.onboarding_sessions (created_at desc);
create index if not exists onboarding_sessions_question_idx on public.onboarding_sessions (question_id, outcome);
