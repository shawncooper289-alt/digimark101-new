# DigiMark101 workspace setup

All supplied website images are stored in public/media and shipped with the app. Skye Studio lives at /studio; Work Desks at /work; pricing uses the latest supplied $97/$297/$997 offers. Checkout is not implemented.

## Supabase activation

1. In the connected Supabase project, run supabase/migrations/20261007_workspace.sql in SQL Editor. This migration references auth.users directly and does not require the older scaffold schema.
2. Verify email/password Auth is enabled. Configure the Auth Site URL and allowed redirect URLs for the intended deployment.
3. In Vercel project Settings → Environment Variables, verify NEXT_PUBLIC_DIGIMARK_SUPABASE_URL and NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY) contain valid public configuration, not an encrypted configuration envelope. Never expose service-role keys.
4. Redeploy, create two test users, and verify each can save and delete their own rows but cannot read or change the other user's rows.

No migration has been applied by this change. Supabase connectivity and Auth have not been verified from the sandbox. Without a signed-in account, workspace items stay in localStorage in this browser; they are not sent to the backend. Shared-device users should export/delete local items before leaving. Browser storage may be cleared. Exports contain user-entered data.

## What is not connected

Live AI chat, phone/voice services, subscription billing, agency seat provisioning, CRM integrations, YouTube publishing and user media upload. Work Desks are editable saved notes/drafts, not full integrations. Ava is a deterministic stage planning tool with that limitation shown in the UI.
