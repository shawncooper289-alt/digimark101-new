-- Account setup: what is slowing the business down, and the first growth plan.
-- Safe to re-run. Apply after 20261028_beta_onboarding.sql.
-- client_onboarding stays readable and writable only by the signed-in user.
-- These columns do not add a policy, a grant, or an owner read.

alter table public.client_onboarding
  add column if not exists main_roadblock text,
  add column if not exists growth_plan text;
