-- Indexes from live migration add_missing_foreign_key_indexes
-- (supabase_migrations.schema_migrations version 20261113042543).
-- Each statement is the live SQL. It runs only when that table exists,
-- so a partial local database does not abort. Already applied on live.

do $$
declare
  stmt text;
begin
  foreach stmt in array array[
    'create index if not exists ava_brand_context_user_id_idx on public.ava_brand_context (user_id)',
    'create index if not exists ava_conversations_user_id_idx on public.ava_conversations (user_id)',
    'create index if not exists ava_voice_calls_user_id_idx on public.ava_voice_calls (user_id)',
    'create index if not exists beta_feedback_user_id_idx on public.beta_feedback (user_id)',
    'create index if not exists beta_feedback_workspace_id_idx on public.beta_feedback (workspace_id)',
    'create index if not exists campaigns_workspace_id_idx on public.campaigns (workspace_id)',
    'create index if not exists client_build_assets_workspace_id_idx on public.client_build_assets (workspace_id)',
    'create index if not exists client_media_workspace_id_idx on public.client_media (workspace_id)',
    'create index if not exists email_sequence_steps_media_id_idx on public.email_sequence_steps (media_id)',
    'create index if not exists email_sequences_owner_id_idx on public.email_sequences (owner_id)',
    'create index if not exists email_sequences_workspace_id_idx on public.email_sequences (workspace_id)',
    'create index if not exists lead_orders_buyer_id_idx on public.lead_orders (buyer_id)',
    'create index if not exists lead_releases_lead_id_idx on public.lead_releases (lead_id)',
    'create index if not exists onboarding_sessions_user_id_idx on public.onboarding_sessions (user_id)',
    'create index if not exists seats_workspace_id_idx on public.seats (workspace_id)',
    'create index if not exists thread_messages_thread_id_idx on public.thread_messages (thread_id)',
    'create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id)',
    'create index if not exists workspaces_white_label_instance_id_idx on public.workspaces (white_label_instance_id)'
  ]
  loop
    if to_regclass('public.' || split_part(split_part(stmt, ' on public.', 2), ' ', 1)) is not null then
      execute stmt;
    end if;
  end loop;
end $$;
