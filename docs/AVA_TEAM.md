# Ava's specialist team

Ava is the manager. Five agents draft work for DigiMark101. They are not named to clients. Anything that would publish, send, spend, or contact a person waits in the owner inbox at `/studio/team`.

This change does not merge, deploy, or apply a migration. Shawn applies the migration and turns on keys later.

## What is fully working

- Owner desk at `/studio/team`: agent cards, task board, approvals inbox, model-spend meter, and the Muse desk (write a brief, copy it, paste Muse's result back for a review).
- Ava tools `team.dispatch`, `team.status`, `team.approve`, `team.reject`, and `muse.brief`.
- Each agent runs a bounded tool loop (4 steps) and can only call its allow-list.
- Destructive and outbound calls become `agent_approvals` rows. Releasing one checks the actor, tool, target, params, and expiry, then runs only that stored request.
- Token and spend caps are checked before the model is called. Defaults are 4,000 tokens a run, 20,000 tokens a day per agent, $12 a month per agent, and $60 a month for the team. Crossing a daily or monthly cap pauses the agent. Crossing the team cap pauses every agent.
- A second pass of the same idempotency key does not start another run.
- Sentinel's tools are read-only. After another agent finishes, a deterministic review checks for invented metrics, the banned line, helper names, and claims that something was sent or charged.
- If the model is not connected, the run stores a starter draft and does not invent a measurement.
- Site SEO: Organization `sameAs` reads `ORGANIZATION_SAME_AS` plus `businessProfile.sameAs` and keeps only https URLs. Sitemap `lastModified` uses each page's content date or source-file time. IndexNow's public key file is `GET /api/indexnow/<INDEXNOW_KEY>`.
- Muse connector (read-mostly, bearer key): list open briefs, submit a result, read brand knowledge, read stored KPIs. OpenAPI: `docs/muse-connector.openapi.yaml` and `GET /api/connectors/muse/openapi`.
- Specialists can use Meta's OpenAI-compatible Model API when `AVA_SPECIALIST_PROVIDER=meta`. It is off by default. A model id ending in `-contributor` is refused. Ava's own chat stays on OpenAI.

## What waits on keys

These paths are implemented and return "not connected" until the env var is set. They do not invent zeros.

| Source | Env | Behavior when set |
| --- | --- | --- |
| Google Search Console | `GOOGLE_SEARCH_CONSOLE_SITE_URL` and `GOOGLE_SERVICE_ACCOUNT_JSON` or `GSC_ACCESS_TOKEN` | Read-only search analytics for the weekly digest |
| GA4 | `GA4_PROPERTY_ID` and the same Google credential | Read-only sessions and users |
| Bing Webmaster | `BING_WEBMASTER_API_KEY` and `BING_SITE_URL` | Read-only clicks and impressions |
| IndexNow | `INDEXNOW_KEY` | Key file is public. A submission still needs an owner approval |
| Meta model | `AVA_SPECIALIST_PROVIDER=meta`, `META_MODEL_API_KEY`, `META_MODEL` | Specialists call `https://api.meta.ai/v1` (override with `META_API_BASE`) |
| Muse connector | `MUSE_CONNECTOR_KEY` and `MUSE_OWNER_USER_ID` or `LEAD_OWNER_USER_ID` | The connector can read and submit. It still cannot post |

`social.publish` still only marks a row scheduled. It does not post to a network. Email sends are queued in the workspace and are not delivered. There is no ad spend tool.

## Data

Migration file (not applied): `supabase/migrations/20261126_ava_team.sql`

Tables, all with `owner_id`, `workspace_id`, the `assign_workspace()` trigger, and owner-only RLS:

- `agent_profiles`
- `agent_runs`
- `agent_artifacts`
- `agent_approvals`
- `muse_handoffs`
- `traffic_kpis`

`specialist_tasks` keeps the original six helper roles and adds `traffic`, `content`, `nurture`, `outreach`, and `sentinel`, plus `parent_id`, `priority`, `due_at`, `idempotency_key`, `attempts`, and `workspace_id`. The old claim function ignores the five new roles. `claim_agent_tasks` is service-role only.

## Routes

- `POST /api/agents/[slug]/run` — owner session
- `GET /api/cron/agents` — hourly at minute 30, `Authorization: Bearer $CRON_SECRET`
- `GET /api/cron/traffic-digest` — Mondays 14:00 UTC
- `GET /api/studio/team` and `POST /api/studio/team` — owner desk
- Muse connector routes under `/api/connectors/muse/`

## Agents

| Slug | Job | Cannot |
| --- | --- | --- |
| traffic | SEO audit, keywords, briefs, drafts, internal-link proposals, weekly KPI digest | Invent a ranking or a click count |
| content | LinkedIn, X, YouTube script, Meta-ready posts, content calendar | Publish without the inbox |
| nurture | Forms, website-audit lead magnet spec, email sequences, lead score | Send without approval and consent |
| outreach | Notes from pasted press queries, directory and pitch drafts | Contact anyone. Shawn sends them |
| sentinel | Rubric review, spend reading | Write, send, publish, or pause by itself. The cap pauses in code |

## 30-day free-traffic playbook

Week 1. Verify Google Search Console and Bing Webmaster, connect GA4, set the IndexNow key, add real `sameAs` URLs, confirm the sitemap dates, pick 3 topic clusters, write 2 drafts, and open the HARO-style accounts Shawn will use himself.

Week 2. Publish 2 more posts (after inbox approval, or by Shawn pasting them), create Clutch, DesignRush, and Sortlist profiles, draft 5 LinkedIn posts, draft 3 Reddit or Quora replies for Shawn to post, and keep the free website-audit spec as a spec.

Week 3. 2 posts, 1 YouTube script, and 5 pitches Shawn sends himself.

Week 4. 2 posts, 1 video (the video maker stays on its own track), about 10 directory listings Shawn submits, and the Sentinel review of the month's drafts and model spend.

No week promises a ranking, a click total, or a lead count. Those show up only after a source is connected and returns a row.

## Env vars Shawn must set

Already used by the app: `OPENAI_API_KEY`, `OPENAI_MODEL`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL`, `LEAD_OWNER_USER_ID`.

New, all server-only:

- `ORGANIZATION_SAME_AS`
- `INDEXNOW_KEY`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`
- `GOOGLE_SERVICE_ACCOUNT_JSON` or `GSC_ACCESS_TOKEN`
- `GA4_PROPERTY_ID`
- `BING_WEBMASTER_API_KEY`
- `BING_SITE_URL`
- `AVA_SPECIALIST_PROVIDER` (`openai` unless Shawn opts into `meta`)
- `META_MODEL_API_KEY`, `META_API_BASE`, `META_MODEL` (not a `-contributor` model)
- `MUSE_CONNECTOR_KEY`
- `MUSE_OWNER_USER_ID` (optional if `LEAD_OWNER_USER_ID` is set)
- `AVA_TEAM_MONTHLY_CAP_CENTS` (optional, default 6000)

`META_MODEL_API_KEY` is the Meta Model API key. It is not `META_APP_SECRET`.

## Go live, later, with an explicit yes

1. Review and merge the pull request. Do not merge it from this change.
2. In the Supabase SQL editor, run `supabase/migrations/20261126_ava_team.sql`. Do not run it from the app, and do not point this environment at the live project to apply it.
3. Add the env vars on the Vercel project. Leave traffic and Muse blank until the keys exist.
4. Redeploy so the crons in `vercel.json` register.
5. Sign in as the owner and open `/studio/team`.
6. Dispatch one draft. Confirm the inbox holds any publish or send, and that the spend meter moves only after a model call.
7. When a Google, Bing, or IndexNow key exists, set it and let the Monday digest store only the rows the API returns.
8. To let Muse call in later, set `MUSE_CONNECTOR_KEY` and point a custom connector at the OpenAPI file. The connector stays read-mostly.

## Nearby open pull requests

This branch does not edit phone calls, the video maker, or the store. Overlap to watch when merging:

- #98 and #104 also touch `lib/openai/server.ts`. This branch leaves that file alone and puts the Meta switch in `lib/openai/provider.ts` and `lib/ava/team/specialist-chat.ts`.
- #99 also edits `vercel.json` (video cron). This branch adds two crons.
- #101 and #102 also edit `app/sitemap.ts`, `components/studio/shell.tsx`, `.env.example`, and, for #102, `lib/ava/tools/registry.ts` and `lib/ava/tools/effects.ts`.
