# Feature parity

Audit date: 19 November 2026. Compared with the public GoHighLevel (HighLevel) feature list and with allinonemarketing.com, then mapped onto this repo after the module desks in this branch.

Sources: [HighLevel pricing](https://www.gohighlevel.com/pricing/), [HighLevel AI tools](https://help.gohighlevel.com/support/solutions/articles/155000002166-ai-tools-in-highlevel), [All In One Marketing features](https://allinonemarketing.com/features/), and [All In One Marketing FAQs](https://allinonemarketing.com/faqs/). Plan names and prices move. The feature names below are the product surface, not a pricing promise.

Status means:

- **Complete** — a person can do the job in this product, including delivery outside the workspace when the feature is about delivery.
- **Partial** — the workspace can store, draft, queue, count, or run the step here. A provider, builder, or public page is still missing, so it is not the outside tool yet.
- **Missing** — there is no product surface for it.

Nothing in this table sends mail, texts, posts, or charges a card. PayPal settings are unchanged.

## GoHighLevel

| Feature | Status | Where it lives |
| --- | --- | --- |
| CRM contacts, companies, notes, tasks | Partial | `contacts`, `companies`, `contact_notes`, `tasks`. Studio page `/studio/contacts`. Ava tools `contacts.*`. Companies and notes are filled by the existing mirror trigger. No smart lists, tags, custom fields, or bulk actions. |
| Unified inbox (SMS, email, Facebook, Instagram, WhatsApp, web chat, phone, notes) | Partial | `threads.channel`, `thread_messages.delivery`, views `inbox_conversations` and `inbox_messages`. Page `/studio/inbox`. Tools `inbox.list`, `inbox.log`, `inbox.send`. A reply can be queued. It is not delivered. Live Gmail, Facebook, Instagram, and WhatsApp threads are not synced. |
| Pipelines and opportunities | Partial | `pipelines`, `pipeline_stages`, `deals`. Page `/studio/pipeline`. Tools `deals.*` and `pipelines.*`. Five stages: new, qualified, proposal, won, lost. No deal value, multiple-pipeline board, or rotten-deal alerts. |
| Calendars and booking | Partial | `calendars`, `bookings`, `appointments`. Page `/studio/calendar`. Tools `calendars.*` and `bookings.*`. Booking does not sync to Google, take a deposit, round-robin, or text a reminder. No public booking page. |
| Funnels and websites | Partial | `sites`, `funnels`, `funnel_pages`. Page `/studio/sites`. Tools `funnels.*` and `sites.*`. Saving a site mirrors a funnel and a first page. No drag-and-drop builder, blog, domain, or publish. |
| Forms, surveys, quizzes | Partial | `forms`, `form_fields`, `form_submissions`. Page `/studio/forms`. Tools `forms.*`. A draft gets name, email, and message. Answers stay in the workspace. No public embed and no quiz score. |
| Email marketing | Partial | `campaigns`, `email_lists`, `email_list_members`, `email_sends`, `email_unsubscribes`. Page `/studio/campaigns`. Tools `campaigns.*`. Drafts and a queued `email_sends` row. No mail provider, template builder, or delivery. |
| SMS marketing | Partial | Inbox channel `sms` and campaign channel `sms`. Same queue rule: nothing is texted. No A2P, number, or SMS provider. |
| Workflows and automations | Partial | `automations`, `automation_steps`, `automation_runs`, plus `workflow_rules` and `workflow_runs`. Page `/studio/automations`. Tools `workflows.*`. Legacy rules still log a note or a memory. Newer rules can draft an email or SMS, draft a review request, or add a task. No if/else canvas and no send. |
| Reputation and reviews | Partial | `reviews`, `review_requests`. Page `/studio/reputation`. Tools `reviews.*`. Log a review, save a reply, queue a request. Google and Facebook are not read or written. |
| Social planner | Partial | `scheduled_posts` and the social connect buttons on `/studio/social`. Tools `social.*`. Drafts can be marked scheduled. They are not published. Connecting a network still depends on that network's app credentials. |
| Memberships, courses, communities | Missing | DigiMark101's own PayPal membership is the pricing page. There is no course host, drip content, or community. |
| Invoices, products, subscriptions | Partial | `products`, `invoices`, `invoice_lines`, plus the existing PayPal `subscriptions` table for DigiMark101 membership. Page `/studio/invoices`. Tools `invoices.*`. Draft, mark paid, void, and record a payment request. The request does not charge a card and does not change PayPal. Estimates and text-to-pay are not built. The products table is ready and has no screen yet. |
| Reporting and attribution | Partial | Page `/studio/reports`. Tool `reports.summary`. Counts of this workspace's rows and of `ava_audit_log`. Not ad attribution, call reports, or a custom dashboard. |
| Call tracking and phone | Partial | Browser voice is on. `POST /api/ava/initiate-call` still says phone calling is not connected. No number pools or call tracking. Phone work is in open PR 98 and is not repeated here. |
| AI employee and voice AI | Partial | Ava answers in the studio, on marketing pages, and on account pages. She can read and write the modules in the tool registry. Voice is the browser and the existing speak route. She is not a phone receptionist. Deletes, queues, and payment requests wait for confirmation. |
| Affiliate manager | Partial | `affiliate_links` stores partner links. There is no affiliate signup, commission, or payout desk. |
| Document signing | Missing | No signature request or signed-file flow. |
| SaaS mode and sub-accounts | Partial | `workspaces`, `workspace_members` (owner, admin, member), and `seats`. The owner can open another client workspace from Studio. No rebilling, no automated plan sale, no usage markup. |
| White label | Partial | `managed_backends` and Ava's `request_backend` tool record a request. A project is not created when management credentials are missing. |
| Mobile app | Missing | `docs/PLAYSTORE.md` is a note. There is no shipped app. |
| Ads manager and prospecting | Missing | Ava can draft an ad note. She cannot open an ad account or spend. No prospecting search. |
| Snapshots, custom menus, meetings, tickets, events, loyalty | Missing | Not in this repo. |

## allinonemarketing.com

The public site sells the same shape of product: one CRM, unlimited-looking email and SMS, funnels, websites, forms, pipelines, reporting, ads, calling, and review requests. The FAQ also names Google Calendar sync, Facebook messenger, Stripe, Twilio, Mailgun, webhooks, and an API.

| Feature | Status | Notes |
| --- | --- | --- |
| Custom CRM, smart lists, tags, bulk actions | Partial | Contacts and companies exist. Smart lists, tags, and bulk actions do not. |
| Automations with email, SMS, and ringless voicemail | Partial | Workflow rules cover the in-workspace actions above. Ringless voicemail is missing. Sends are not delivered. |
| Email and SMS builder | Partial | A draft has a name, a channel, and a brief. No visual builder. |
| Phone calls, recording, number pools | Missing on this branch | Browser voice only. PR 98 is the open phone change. |
| Website builder and hosting | Partial | Draft site and funnel records. No hosting and no builder. |
| Form and survey builder | Partial | `/studio/forms`. |
| Funnel builder | Partial | `/studio/sites`. |
| Sales pipelines | Partial | `/studio/pipeline`. |
| Reporting and source reporting | Partial | Workspace counts only. No source or ads reporting. |
| Facebook and Google lead ads | Missing | No lead-ad import. |
| Reputation manager | Partial | `/studio/reputation`. No live Google or Facebook replies. |
| Calendar and Google sync | Partial | Booking without Google sync. |
| Stripe payments | Missing | Not added. PayPal membership stays as it is. |
| AI SMS, email, and calling bots | Partial | Ava drafts and queues. She does not send or place a carrier call from this branch. |
| Webhooks and public API | Missing | No customer-facing API or outbound webhook desk. |

## Ava

Ava's tools are declared once in `lib/ava/tools/registry.ts`. `lib/ava/tools/permissions.ts` decides who can run them. `lib/ava/tools/run.ts` checks the signed-in user, keeps a non-owner inside their own `owner_id`, and lets the platform owner pass a workspace id. Rows are still under the existing row level security policies.

| Rule | What the code does |
| --- | --- |
| Workspace scope | A member's writes use their user id. Another workspace id is refused unless the caller is the platform owner, and then the server key is required. |
| Roles | Guest is refused. Member can read and save. Admin can delete or queue after confirmation. Only an owner can record a payment request. Office records require the platform owner. |
| Confirmation | Deletes, cancels, voids, sends, publishes, review requests, and payment requests return `pending` until `confirmed` is true. |
| No charge and no delivery | A confirmed send writes `queued` or `scheduled`. A payment request sets `payment_requested`. PayPal is not called. |
| Audit | Each deny, pending, and execute is inserted into `ava_audit_log`. A send, delete, or payment request is refused if that insert fails. |
| Page context | The page publishes `window.__AVA_PAGE__` (path, module, title, visible rows). Chat sends it. "What is on this page?" is answered from that context. The page does not raise anyone's role. |

Tests for these rules are in `tests/ava-tools-permissions.test.cjs`.

## This branch

Built on `main`. Open PR 98 (Ava models, phone, spam limit) and PR 99 (video maker) were not edited except `lib/ava/handle.ts`, which only forwards the page and the pending tool list. Video render files were not changed. `video.list` only reads `client_media`.

New migration, not applied: `supabase/migrations/20261119_feature_parity.sql`.

No new environment variables are required for the desks to load after that migration. No Vercel, Supabase, or PayPal setting was changed.

## Next

1. Apply `supabase/migrations/20261119_feature_parity.sql` in the Supabase project `sdjbvdujcmfmdjfolmhv`. Do not apply it from the app.
2. Connect a mail provider and an SMS provider. Until those keys exist, keep the queue honest and do not mark rows `sent`.
3. Public booking page, Google Calendar sync, and reminder texts.
4. Public form embed and a real page builder. Publishing stays a separate confirmed step.
5. Google and Facebook review sync.
6. Social publish after the existing connect tokens, still behind confirmation.
7. Deal value, more than one pipeline on the board, tags, and smart lists.
8. Product screen on top of `products`, then estimates. Leave PayPal membership checkout alone.
9. Attribution: source on the contact, then a report that only counts stored facts.
10. Course and community tables, only after a host is chosen.
11. Document signing.
12. Affiliate commissions, not just `affiliate_links`.
13. SaaS rebilling. Do not invent usage prices.
14. Wire the same tool registry into the owner office at avaskye.online after PR 98 lands, so the two apps do not edit the same phone files.
15. Let a `workspace_members` admin operate the parent workspace without the service key. The permission function already knows member and admin. The studio API still treats the signed-in user as the data owner.
