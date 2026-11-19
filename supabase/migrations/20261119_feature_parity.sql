-- Feature parity tables for the studio modules and Ava's audit log.
-- Additive only. Do not edit PayPal tables or settings.
-- The owner applies this file. The app does not run it.

alter table public.threads add column if not exists channel text;
update public.threads set channel = 'note' where channel is null or btrim(channel) = '';
alter table public.threads alter column channel set default 'note';
alter table public.threads alter column channel set not null;

alter table public.thread_messages add column if not exists delivery text;
update public.thread_messages set delivery = 'logged' where delivery is null or btrim(delivery) = '';
alter table public.thread_messages alter column delivery set default 'logged';
alter table public.thread_messages alter column delivery set not null;

do $$
begin
  alter table public.threads add constraint threads_channel_check
    check (channel in ('note', 'sms', 'email', 'facebook', 'instagram', 'whatsapp', 'webchat', 'phone'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.thread_messages add constraint thread_messages_delivery_check
    check (delivery in ('logged', 'draft', 'queued', 'sent'));
exception when duplicate_object then null;
end $$;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null default 'form' check (kind in ('form', 'survey', 'quiz')),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'email', 'textarea', 'choice')),
  required boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (form_id, key)
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  source text not null default 'manual' check (source in ('google', 'facebook', 'manual')),
  author text not null default '',
  rating integer not null default 5 check (rating between 1 and 5),
  body text not null,
  reply text not null default '',
  status text not null default 'logged' check (status in ('logged', 'replied')),
  created_at timestamptz not null default now()
);

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_name text not null,
  channel text not null default 'email' check (channel in ('email', 'sms')),
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent')),
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'USD',
  interval text not null default 'one_time' check (interval in ('one_time', 'month', 'year')),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'open', 'payment_requested', 'paid', 'void')),
  currency text not null default 'USD',
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  trigger_key text not null check (trigger_key in ('contact.created', 'appointment.booked', 'deal.moved', 'form.submitted', 'review.received', 'invoice.paid')),
  action_key text not null check (action_key in ('log_inbox', 'remember', 'draft_email', 'draft_sms', 'request_review', 'create_task')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.workflow_rules (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'succeeded', 'failed')),
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.ava_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  tool text not null,
  effect text not null,
  status text not null check (status in ('denied', 'pending', 'executed')),
  page_path text not null default '',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists forms_owner_idx on public.forms (owner_id, created_at desc);
create index if not exists forms_workspace_idx on public.forms (workspace_id);
create index if not exists form_fields_form_idx on public.form_fields (form_id, position);
create index if not exists form_fields_owner_idx on public.form_fields (owner_id);
create index if not exists form_submissions_form_idx on public.form_submissions (form_id, created_at desc);
create index if not exists form_submissions_owner_idx on public.form_submissions (owner_id);
create index if not exists reviews_owner_idx on public.reviews (owner_id, created_at desc);
create index if not exists reviews_workspace_idx on public.reviews (workspace_id);
create index if not exists review_requests_owner_idx on public.review_requests (owner_id, created_at desc);
create index if not exists products_owner_idx on public.products (owner_id);
create index if not exists invoices_owner_idx on public.invoices (owner_id, created_at desc);
create index if not exists invoices_workspace_idx on public.invoices (workspace_id);
create index if not exists invoice_lines_invoice_idx on public.invoice_lines (invoice_id);
create index if not exists invoice_lines_product_idx on public.invoice_lines (product_id);
create index if not exists invoice_lines_owner_idx on public.invoice_lines (owner_id);
create index if not exists workflow_rules_owner_idx on public.workflow_rules (owner_id, created_at desc);
create index if not exists workflow_runs_rule_idx on public.workflow_runs (rule_id, created_at desc);
create index if not exists workflow_runs_owner_idx on public.workflow_runs (owner_id);
create index if not exists ava_audit_actor_idx on public.ava_audit_log (actor_id, created_at desc);
create index if not exists ava_audit_owner_idx on public.ava_audit_log (owner_id, created_at desc);
create index if not exists threads_channel_idx on public.threads (owner_id, channel);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'forms', 'form_fields', 'form_submissions', 'reviews', 'review_requests',
    'products', 'invoices', 'invoice_lines', 'workflow_rules', 'workflow_runs'
  ]
  loop
    execute format('drop trigger if exists assign_workspace_%I on public.%I', tbl, tbl);
    execute format(
      'create trigger assign_workspace_%I before insert or update on public.%I for each row execute function public.assign_workspace()',
      tbl, tbl
    );
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I_access on public.%I', tbl, tbl);
    execute format(
      'create policy %I_access on public.%I for all to authenticated using ((select public.can_access_workspace(workspace_id, owner_id))) with check ((select public.can_access_workspace(workspace_id, owner_id)))',
      tbl, tbl
    );
    execute format('revoke all on public.%I from anon, public', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', tbl);
  end loop;
end $$;

alter table public.ava_audit_log enable row level security;
drop policy if exists ava_audit_log_read on public.ava_audit_log;
drop policy if exists ava_audit_log_insert on public.ava_audit_log;
create policy ava_audit_log_read on public.ava_audit_log
  for select to authenticated
  using (
    actor_id = (select auth.uid())
    or owner_id = (select auth.uid())
    or (select public.is_owner())
  );
create policy ava_audit_log_insert on public.ava_audit_log
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (
      owner_id = (select auth.uid())
      or (select public.is_owner())
    )
  );
revoke all on public.ava_audit_log from anon, public;
grant select, insert on public.ava_audit_log to authenticated;
grant select, insert, update, delete on public.ava_audit_log to service_role;

create or replace view public.inbox_conversations
with (security_invoker = true) as
select id, owner_id, workspace_id, contact_name, subject, channel, created_at
from public.threads;

create or replace view public.inbox_messages
with (security_invoker = true) as
select id, owner_id, workspace_id, thread_id, body, sender, delivery, created_at
from public.thread_messages;
