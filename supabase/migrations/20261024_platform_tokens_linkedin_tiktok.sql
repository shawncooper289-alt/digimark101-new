-- supabase/migrations/20261024_platform_tokens_linkedin_tiktok.sql
-- Extend platform_tokens to support LinkedIn and TikTok

alter table platform_tokens
  drop constraint if exists platform_tokens_platform_check;

alter table platform_tokens
  add constraint platform_tokens_platform_check
  check (platform in ('facebook', 'instagram', 'google', 'website', 'linkedin', 'tiktok'));