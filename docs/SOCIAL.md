# Social onboarding

Studio path: `/studio/social`. Office path: `/social` on avaskye.online (owner session).

Each provider shows **Needs app credentials** until every variable in its row is set, plus `SOCIAL_TOKEN_KEY`. Connect does not start, and tokens are not stored, while that list is incomplete. Stored tokens are AES-256-GCM ciphertext. Members can read `social_account_status` (name and network only). They cannot select `platform_tokens`.

Apply `supabase/migrations/20261025_social_accounts.sql` after `20261024_platform_tokens.sql` and `20261024_platform_tokens_linkedin_tiktok.sql`. The project is the one in `NEXT_PUBLIC_SUPABASE_URL`.

Ava can draft a post for these networks. Confirming the draft writes `scheduled_posts`. It does not publish.

## Env vars (both Vercel projects)

`SOCIAL_TOKEN_KEY` is server-only. Generate it with `openssl rand -base64 32`. The value must decode to 32 bytes. It encrypts tokens and signs the OAuth `state`. Do not prefix it with `NEXT_PUBLIC_`.

| Provider | Variables | Developer app |
| --- | --- | --- |
| Facebook | `META_APP_ID`, `META_APP_SECRET` | Meta for Developers. Use cases: pages list, read engagement, manage posts. |
| Instagram | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | Instagram Basic Display or the Instagram product on the Meta app. |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | LinkedIn app. Products: Sign In with LinkedIn, Share on LinkedIn. |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET` | X developer portal. OAuth 2.0 with PKCE. User scopes: tweet.read, tweet.write, users.read, offline.access. |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | TikTok for Developers. Login Kit and Content Posting. |
| YouTube | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client. YouTube Data API. Scopes `youtube.readonly` and `youtube.upload`. |
| Google Business Profile | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Same Google client, separate redirect. Scope `https://www.googleapis.com/auth/business.manage`. Enable the Business Profile APIs. |

YouTube and Google Business can share one Google OAuth client. They still need both redirect URIs.

## Redirect URIs

Customer site (`NEXT_PUBLIC_SITE_URL`, production `https://www.digimark101.com`):

- `/api/connect/callback/facebook`
- `/api/connect/callback/instagram`
- `/api/connect/callback/linkedin`
- `/api/connect/callback/x`
- `/api/connect/callback/tiktok`
- `/api/connect/callback/youtube`
- `/api/connect/callback/google`

Founder office (add the same paths under both hosts if the office should connect too):

- `https://www.avaskye.online/api/office/social/callback/<provider>`
- `https://avaskye.online/api/office/social/callback/<provider>`

`<provider>` is `facebook`, `instagram`, `linkedin`, `x`, `tiktok`, `youtube`, or `google`.

Set the same variables on the digimark101.com project and the avaskye.online project. The office project root directory is `avaskye-online`.
