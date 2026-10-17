# DigiMark101

This is the owner manual for DigiMark101 and the founder office. The public site is [www.digimark101.com](https://www.digimark101.com). The private office is [avaskye.online](https://avaskye.online). They share one Supabase project. Production for the public site deploys from `main`.

## Vision

DigiMark101 is the marketing platform a serious agency would rather own than rent. The bar is a system that goes past a rented CRM: one dark site, one studio, and Ava Skye guiding the work. Navigation stays plain. A person can move from the offer, to the studio, to a confirmed save, without a tour.

The public promise on the homepage is **Own the system. Build the dynasty.** That line stays. So do the transparent gold logo, Ava’s portrait on the first screen, Hear Ava, and the small semi-transparent photo that opens her chat.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The marketing pages and guide-mode Ava build with no secrets. The founder office is a second app:

```bash
cd avaskye-online
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Stack

- **Site:** Next.js App Router at the repository root, Tailwind, deployed on Vercel. Production branch is `main`.
- **Data:** Supabase Auth, Postgres, and row-level security. The anon key is public. The service role is server-only and is how Ava’s server jobs and the owner read lead personal details.
- **Payments:** PayPal subscriptions for the public membership. Field, Studio, and Partner stay quoted in a proposal.
- **Model:** one of `AVA_LLM_API_KEY`, `XAI_API_KEY`, or `OPENAI_API_KEY`. With none of them, Ava still answers from the studio guide.

## Backend

The Postgres schema is in `supabase/migrations`, applied in filename order. [docs/BACKEND.md](docs/BACKEND.md) lists every file, the row-level rules, and which Next.js route or Supabase edge function runs each job. `lib/supabase/types.ts` matches that schema. `20261018_complete_backend.sql` adds workspaces, companies, tasks, pipelines, email lists, funnels, bookings, lead niches, consent, enrichment, the audit log, Ava's identity and dress codes, PayPal plans, webhook events, provisioning jobs, and affiliate links. Lead personal details stay in `lead_private_contacts` for the owner and the service role.

## The public site

Dark theme. Services, placeholder work structures, packages, pricing, journal, about, contact, privacy, terms, the lead marketplace, and the studio.

The homepage hero is the current redesign:

- Headline: Own the system. Build the dynasty.
- Transparent gold DigiMark101 lockup. No cream plate. No circle smiley.
- Ava’s photograph in the first screen, with Hear Ava under the headline. Hear Ava never autoplays.
- A small semi-transparent photo of Ava that can be dragged. The position is remembered in the browser, and under the signed-in email when there is one. Voice on speaks her replies and then listens. Typing always works.

Work pages are labeled samples. No client names and no performance numbers are invented.

### Pricing

| Offer | What it is | Price |
| --- | --- | --- |
| Field | One channel, quoted in a proposal | Proposal |
| Studio | Connected channels, quoted in a proposal | Proposal |
| Partner | Embedded mix, quoted in a proposal | Proposal |
| Membership, monthly | Public PayPal plan, auto-renewing | $497 every month. This is the placeholder base. |
| Membership, quarterly | Public PayPal plan | $1,312 every 3 months, about 12% off the monthly base |
| Membership, semiannual | Public PayPal plan | $2,326 every 6 months, about 22% off the monthly base |

Prices live in `lib/paypal/membership.json`. Checkout stays “coming soon” until the PayPal client id and plan ids are set. The owner account skips membership billing.

## The studio

Signed-in clients get a private workspace. Without Supabase the same screens run as a labeled browser preview.

| Section | Path | What it does |
| --- | --- | --- |
| Today | `/studio` | The working home |
| Contacts | `/studio/contacts` | CRM contacts |
| Pipeline | `/studio/pipeline` | Deals and stages |
| Calendar | `/studio/calendar` | Appointments |
| Inbox | `/studio/inbox` | Notes logged here. It is not a connected mailbox yet. |
| Email | `/studio/campaigns` | Campaign drafts, including email. Nothing is sent. |
| Funnels | `/studio/sites` | Site and funnel records. Nothing is published. |
| Automations | `/studio/automations` | Three triggers: contact created, appointment booked, deal moved. Actions: log an inbox note, or save a memory. |
| Reports | `/studio/reports` | Counts of this workspace. No benchmarks. |
| Leads | `/studio/leads` | Premium lead store for buyers. Personal details stay hidden. |
| Files | `/studio/files` | Private uploads |
| Memory | `/studio/memory` | Facts Ava stores for this client only |
| Ava skills | `/studio/knowledge` | The recovered skill book |
| Backend | `/studio/backend` | Supabase for Platforms white-label handoff |

Ava can draft any of those writes from chat. The widget shows the draft and waits for **Confirm save**. She can also fill a form that is on the screen and open a studio page. She asks one question when a required fact is missing.

## Leads engine

Leads enter through connectors and imports, not by scraping HTML. Each row is staged. Only a premium, consented lead in a niche the store is willing to sell becomes a public listing. Buyers see an anonymized preview. Raw email and phone live in `lead_private_contacts`.

Consent is required before storage. Opt-out and suppression are honored. The design follows GDPR, CCPA, and CAN-SPAM: a person can object, a buyer does not receive a secret the seller was not allowed to share, and marketing mail needs a real permission and a way to stop. The hourly job is `GET /api/cron/leads` with `Authorization: Bearer CRON_SECRET`.

## Privacy

Customers never see another client’s rows. Buyers never see lead personal details. **Only the owner and Ava’s server role** (the Supabase service role on the server) can read PII. The anon and authenticated roles cannot select `lead_private_contacts`.

## The owner

Set `OWNER_EMAIL` on the server to `digimark101@mail.com`. Do not put that address in client code and do not prefix the variable with `NEXT_PUBLIC_`. On sign-in the server stamps `app_metadata.role` as `owner`. That account has unlimited workspaces, skips membership checkout and seat limits, and sees the workspace switcher plus the Founder office link.

Apply `supabase/migrations/20261017_owner_role.sql` and the later owner-office migrations. Until the database trigger exists, a signed-in session whose email matches `OWNER_EMAIL` is still treated as the owner.

## Founder office

`avaskye.online` is Shawn Cooper’s private desk: leads with PII, CRM, pipeline, automations, billing and PayPal, clients, reports, settings, internal tools, and Ava guiding. Customers are denied, including customers who are signed in on digimark101.com.

The office app is the nested `avaskye-online` directory. It needs its **own** Vercel project. Set the project root directory to `avaskye-online`, attach the domain, and give it the same Supabase env plus `OWNER_EMAIL`. The production branch for that project should be `main` as well, once the root directory is set. A push to `main` does not update avaskye.online until that project is wired. The public site and the office do not share a Vercel project.

Ava’s look there defaults to the relaxed daily rotation. Visitor mode, from the office control or from a sentence such as “guests are coming” or “back to casual,” switches her to the professional blazer and back. The choice is stored per owner.

The office voice switch speaks her replies with the long-A pronunciation. Display text still says Ava.

## Supabase for Platforms

The studio Backend screen is the white-label path: a client can be pointed at a managed Supabase project instead of sharing tables by hand. Affiliate links for Supabase and Vercel appear only when `SUPABASE_AFFILIATE_URL` and `VERCEL_AFFILIATE_URL` are set.

## Ava

Identity, look, dress codes, voice, and pronunciation are locked in `lib/ava/identity.ts` and described in `docs/AVA_IDENTITY.md`.

**Ava is always pronounced with a long A, like the letter A** (`Ay-vuh`, IPA `/ˈeɪvə/`). Browser speech and TTS replace the spoken name. The letters on screen stay Ava. SSML is used only when `AVA_TTS_SSML=true`.

Her skill book is `lib/ava/knowledge-base.ts`: pages and funnels, social pages, delegation, client management, other agents, sales conversations, and workspace admin. Recovered from the October 2026 knowledge base. She still will not invent a client, a testimonial, or a statistic.

Per-client memory is confirmed before it is saved, and one client cannot read another client’s memory.

Chat actions she can draft: create a contact, create or move a deal, book an appointment, log an inbox note, start a campaign draft, create a site or funnel record, create an automation, remember a fact, navigate, and fill a visible form.

## Environment

Copy `.env.example`. Server-only values must never use the `NEXT_PUBLIC_` prefix.

| Variable | Role |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `XAI_API_KEY`, `XAI_MODEL` | Preferred live model. Default model `grok-4.7` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Used when xAI and `AVA_LLM_API_KEY` are unset |
| `AVA_LLM_API_KEY`, `AVA_LLM_BASE_URL`, `AVA_LLM_MODEL` | If set, this provider wins |
| `AVA_TTS_API_KEY`, `AVA_TTS_BASE_URL`, `AVA_TTS_MODEL`, `AVA_TTS_VOICE` | Optional generated Hear Ava audio. Browser speech is the fallback |
| `AVA_TTS_SSML` | `true` only when that provider honors IPA phonemes |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth and studio. Aliases are listed in `.env.example` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Leads PII, webhooks, owner stamp |
| `OWNER_EMAIL` | Server only. Set to `digimark101@mail.com` |
| `LEAD_HASH_SALT` | Stable salt for suppression hashes |
| `LEAD_PREMIUM_MIN_SCORE` | Default 70 |
| `LEAD_OWNER_USER_ID` | Owner user id for premium counts |
| `LEAD_IMPORT_KEY` | Bearer token for imports |
| `CRON_SECRET` | Bearer token for the hourly lead job |
| `LEAD_CONNECTOR_URL`, `LEAD_CONNECTOR_TOKEN`, `LEAD_CONNECTORS` | Consented JSON lead sources |
| `ENRICHMENT_BASE_URL`, `ENRICHMENT_API_KEY` | Optional enrichment. Off when either is missing |
| `PAYPAL_ENV` | `sandbox` or `live` |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` and the three `NEXT_PUBLIC_PAYPAL_PLAN_*` ids | Membership buttons |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` | Server only |
| `SUPABASE_AFFILIATE_URL`, `VERCEL_AFFILIATE_URL` | Optional partner links. Hidden when unset |

The founder office reads the same Supabase names, plus `OWNER_EMAIL`. It also lists `LEAD_HASH_SALT` and the PayPal server secrets when those jobs run there.

## Deployment

1. Vercel project for www.digimark101.com: repository root, production branch `main`, build `npm run build`.
2. Pushing `main` is what ships the public site.
3. Second Vercel project for avaskye.online: root directory `avaskye-online`, same production branch once that root is selected, domain attached there. Env as above.
4. Apply the SQL in `supabase/migrations/` in order, including owner role, office appearance, owner office access, leads, and managed backends.
5. Sign in once as the owner so the role stamp runs.

The older `digimark101-new` Vercel project is not the customer domain. A failure there does not replace a successful Production deployment of digimark101.com.

## Where the code lives

- Public copy: `lib/site.ts`
- Membership prices: `lib/paypal/membership.json`
- Ava’s rules: `lib/ava/respond.ts`
- Ava’s identity and pronunciation: `lib/ava/identity.ts`, `lib/ava/speech.ts`
- Ava’s skills: `lib/ava/knowledge-base.ts`
- Leads: `lib/leads.ts` and `supabase/migrations/`
- Founder office: `avaskye-online/`

Do not add client names or performance numbers unless a partner has approved them.

## Roadmap

Already in this build: the dark site and studio, PayPal membership config, the premium lead store, owner access, the founder office with visitor mode, Ava’s confirm-before-save actions, the skill book, and spoken Ava with the long A.

Still ahead, and labeled as such on the screens:

1. Visual funnel builder and publishing on a client domain.
2. Actually sending email, then SMS. Drafts exist now.
3. Inbox connectors for real mail and social, not only notes.
4. Public booking links and calendar sync.
5. A broader automation runner.
6. Ad and analytics connectors. Reports stay on approved numbers.
7. More than one person in a client workspace.
8. Proposal invoices beyond the three PayPal membership plans.
9. A searchable document index for Ava. Client facts already live in Memory. Pinecone is not required for this build.

## Older versions

`main` already held the dark site, the studio tools from `vercel-agent/grok-complete-build`, and the owner office. The closed purple branch `cursor/digimark101-site-e3b5` had the same studio actions with a lighter public design; that design stays retired. The file `improved-digiMark101` in history is an early export (voice widget notes, phone-call UI, a first schema). Phone calling is still not connected. What that history and the October knowledge base still had, and `main` did not, is now the skill book, the Ava skills page, and the Email and Funnels labels on the drafts that were already there.
