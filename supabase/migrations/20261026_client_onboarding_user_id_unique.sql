-- One onboarding row per account. The earlier index on user_id is not unique,
-- so PostgREST upsert (on conflict user_id) cannot target it.
-- Deduplicate first, then replace that lookup index with a unique one.
-- Safe to re-run. Must run after 20261024_client_onboarding.sql.

delete from public.client_onboarding as older
using public.client_onboarding as newer
where older.user_id is not null
  and older.user_id = newer.user_id
  and older.id <> newer.id
  and (
    older.updated_at < newer.updated_at
    or (older.updated_at is not distinct from newer.updated_at and older.created_at < newer.created_at)
    or (
      older.updated_at is not distinct from newer.updated_at
      and older.created_at is not distinct from newer.created_at
      and older.id < newer.id
    )
  );

drop index if exists public.idx_client_onboarding_user_id;

create unique index if not exists client_onboarding_user_id_uidx
  on public.client_onboarding (user_id);
