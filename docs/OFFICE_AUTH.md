# Founder office sign-in (avaskye.online)

The office is the nested Next.js app in `avaskye-online/`. It is not served by the digimark101.com Vercel project. Password sign-in and email magic links both go through Supabase Auth on the project named by `NEXT_PUBLIC_SUPABASE_URL`. The code does not hardcode a project ref.

Only mailboxes listed in server-only `OWNER_EMAIL` (comma-separated) or users already stamped with `app_metadata.role = owner` receive a session cookie. A non-owner link is rejected. On success the server calls `sync_owner_email` for an `OWNER_EMAIL` mailbox when `SUPABASE_SERVICE_ROLE_KEY` is set, which stamps `app_metadata.role = owner`. Looking up other stamped owners for a link also requires the service key.

## Supabase Auth dashboard

Open the project from `NEXT_PUBLIC_SUPABASE_URL` → Authentication → URL configuration.

| Setting | Value |
| --- | --- |
| Site URL | `https://www.digimark101.com` |
| Redirect URLs | `https://www.digimark101.com/auth/callback` |
| Redirect URLs | `https://www.digimark101.com/reset-password` |
| Redirect URLs | `https://digimark101.com/auth/callback` |
| Redirect URLs | `https://www.avaskye.online/auth/callback` |
| Redirect URLs | `https://www.avaskye.online/reset-password` |
| Redirect URLs | `https://avaskye.online/auth/callback` |
| Redirect URLs | `http://localhost:3000/auth/callback` |
| Redirect URLs | `http://localhost:3000/reset-password` |

Production emails use `https://www.digimark101.com` for customer signup, recovery, and invites, and `https://www.avaskye.online` for office login and password reset. Only local development uses localhost. Confirm the email templates keep the redirect, then test a real login and reset on both sites. Add any other required redirect URLs without removing these.

### When a magic link opens localhost

The office already sends `redirect_to=https://www.avaskye.online/auth/callback` (or `/reset-password` for recovery). Setting `NEXT_PUBLIC_SITE_URL` again does not change Supabase's hosted redirect allowlist or email templates.

- Check **URL Configuration** on the exact Supabase project used by the office's `NEXT_PUBLIC_SUPABASE_URL`, not an unrelated Marketplace resource. Set **Site URL** to the customer origin above because the two apps share Auth. Add the exact callback and reset URLs above; allowing only `https://avaskye.online` does not allow `https://www.avaskye.online/auth/callback`.
- Check **Email Templates** for magic links and recovery. A template must preserve the requested destination rather than hardcoding localhost or always using `.SiteURL`. The standard `.ConfirmationURL` contains the verification link and its redirect. See [Supabase's redirect and template guidance](https://supabase.com/docs/guides/auth/redirect-urls).
- Save the hosted settings, then request a **new** link and open it in the same browser that requested it. Previously sent links are not repaired by changing the settings. Do not share login links or tokens.
- For a password rejection, use the recovery form after correcting the redirect settings. A 401 response alone does not prove whether the password, email confirmation, or owner authorization failed. Do not disable confirmation or owner checks to bypass it.

`supabase/config.toml` configures local Supabase. Editing it, merging this repository, or redeploying Next.js does **not** update hosted Supabase Auth settings. The hosted configuration must be saved separately; a successful deployment is not proof that an email login completed.

Authentication → Providers → Email: enable Email. Turn on email/password if the password form should work. Magic links use the same provider. Confirm the built-in mailer or custom SMTP is sending, or the link never arrives.

## Vercel env for the office project

Create or open the Vercel project that owns `avaskye.online` and `www.avaskye.online`. It must be a **separate** project from digimark101.com.

1. Import `shawncooper289-alt/DigiMark101-new`.
2. Set **Root Directory** to `avaskye-online`.
3. Framework preset: Next.js. `avaskye-online/vercel.json` already sets that.
4. Production branch: `main`.
5. Production, Preview, and Development:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL. The ref is whatever this URL contains. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon or `sb_publishable_` key. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also read. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Needed to stamp the owner role and to grant seats. |
| `OWNER_EMAIL` | Server-only founder mailbox. Not a `NEXT_PUBLIC_` variable. |

A push to `main` does not update avaskye.online until this project’s root is `avaskye-online` and it deploys that commit. If the live site is an old deployment from another repo, remove the domains from that project first, then attach them here.

The sign-in screen lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OWNER_EMAIL` by name when any of them is empty. It does not print their values.
