# Spam protection

Public forms and Ava's chat used to count requests in the memory of whichever server happened to answer. On Vercel that memory is not shared, so a flood was barely slowed down. The same routes now share one count when Upstash Redis is connected. If those two variables are missing, the site falls back to the old per-server count and keeps working.

## Variables

Install **Upstash Redis** from the Vercel Marketplace on **both** projects (`digimark101.com` and `avaskye-online`). The integration writes these names. Do not invent different names, and do not commit the values.

| Variable | Role |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Redis REST address |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |

Set them for Production and Preview. They are server-only.

The shared limit covers Ava chat and voice chat, the contact and membership forms, beta join, signup and sign-in attempts, the click beacon at `/api/cta`, studio saves, studio files, video requests, lead opt-out, and the phone routes. The office sign-in, office speech, and office video routes use the same Redis when the office project has the two variables.

## Optional human check

Cloudflare Turnstile can be added without a code change beyond the two variables. Leave them empty and the forms look the same as they do today.

1. In the Cloudflare dashboard, open Turnstile and add a widget for `digimark101.com` and `www.digimark101.com`.
2. Put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (this one is public).
3. Put the secret key in `TURNSTILE_SECRET_KEY` (server-only, no `NEXT_PUBLIC_` prefix).
4. Redeploy. The contact form, beta form, membership request, and sign-in form then ask the visitor to confirm they are a person.

If the secret is set and the site key is not, those forms will reject submissions. Set both, or neither.

## Optional Vercel Firewall rule

Vercel Firewall can also rate-limit at the edge. That is separate from the Redis count and is not turned on by this repo, because publishing a rule changes the live project. After you link the project, a starting rule is:

```bash
vercel firewall rules add "Limit public Ava and forms" \
  --condition '{"type":"path","op":"pre","value":"/api/ava"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 60 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes
```

`log` only records the overflow so you can see it before it blocks anyone. Change that action to `rate_limit` when you want a real block. Review the draft with `vercel firewall diff`, then `vercel firewall publish --yes` only when you want it live. Repeat for the office project if you want the same edge limit there. Counters are per region, so the real ceiling is higher than the number in the rule. Bot Protection in the Vercel Firewall dashboard is another switch you can enable yourself. It is not changed by this deployment.
