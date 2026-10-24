# Selling and delivering a seat

A seat is a row in `public.seats`. An active seat belongs to a Supabase Auth user and that user's personal workspace. Apply `supabase/migrations/20261025_seats.sql` on the hosted project (the one in `NEXT_PUBLIC_SUPABASE_URL`) before grants or PayPal deliveries will stick.

## Paths

1. **PayPal.** Pricing shows the subscription button when `NEXT_PUBLIC_PAYPAL_CLIENT_ID` and the plan id for the selected term are set. Checkout sends the signed-in user id as `custom_id`. The webhook `POST /api/webhooks/paypal` verifies the event, upserts `subscriptions`, and on `ACTIVE` calls `deliver_seat`. A magic-link invite goes to `https://www.digimark101.com/auth/callback` (from `NEXT_PUBLIC_SITE_URL`), which opens `/studio`.
2. **Request access.** If a plan id is missing, the pricing card shows **Request access**. That stores a consented lead and a `pending` seat. It does not send a login until someone grants the seat.
3. **Grant seat manually.** Owner office → Billing. Confirm the checkbox, then the office calls `deliver_seat` with source `manual` and emails the same studio login link.

The welcome message is the Supabase Auth magic link. There is no separate mailer. Supabase must be allowed to send email (built-in mailer or custom SMTP).

## Customer return URL

Authentication → URL configuration must include:

- `https://www.digimark101.com/auth/callback`
- `https://digimark101.com/auth/callback`

Site URL for the customer project can stay `https://www.digimark101.com`. The office Site URL is separate and is documented in [OFFICE_AUTH.md](./OFFICE_AUTH.md). Both apps share one Supabase project.
