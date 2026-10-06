# DigiMark101 agency rebuild

## Scope

The homepage now presents the agency's brand, web/conversion, search/content, paid/social, automation strategy, and AI knowledge service areas. These are strategic offerings, not a claim that campaign execution, CRM, billing, or autonomous agents have been implemented. No unsupported comparison with HighLevel, fabricated testimonials, or performance metrics is used.

The existing Supabase-backed Ava workspace shares the visual system. Its implemented tools remain authenticated advisory chat, private knowledge documents, and read-only recent X research. Session restore failures and non-JSON service responses now have recoverable messages. Existing provider integrations and database row-level security are preserved.

## Failure diagnosis

The earlier production deployment `dpl_9zsB62h6L6SYbiA1zVsmbu3xfPMZ` reported `git_info_fail` and `Git information retrieval failed for this deployment.` It did not provide a compiler failure. The existing source also compiled locally before this redesign. Uploading source directly through the CLI validates the rebuilt app without relying on that failing Git source retrieval. It does not repair or configure a persistent Git connection.

## Checks performed

- `npm ci`, `npm run build`, `npm run lint`, `npx tsc --noEmit`.
- Local production server: HTTP 200 for homepage, expected agency content and metadata, workspace rendering without secrets.
- Unauthenticated chat, knowledge, and X endpoints reject requests without making provider calls.
- `npm audit fix` updated the compatible transitive source-map-js dependency; `npm audit --omit=dev` reports zero vulnerabilities. Five high-severity development-toolchain findings remain in the braces/Next ESLint chain. The registry's suggested forced fix downgrades eslint-config-next to a different Next major; that incompatible change was not applied.

## Before production launch

1. Review the preview visually on desktop and mobile, including keyboard navigation and focus states. The agent verified production HTML, not browser screenshots.
2. In Vercel project Settings → Environment Variables, verify Preview and Production separately. Supported Supabase prefixes are documented in `docs/PLATFORM_SETUP.md`. Do not put service-role credentials in public variables.
3. In Supabase, verify the existing workspace migration and row-level security, email auth, and preview/production redirect URLs. Test two separate users for isolation.
4. Test real sign-in, document saving and retrieval, Ava replies, and X research. Provider authentication, billing, quota and availability cannot be certified by a successful frontend build.
5. Add rate limits and account/entitlement enforcement before public paid access. Hosted PayPal checkout is not subscription provisioning.
6. Review and approve production promotion separately. This rebuild does not change production domains, connect Git, or merge into main.

## Beyond the current app

A platform exceeding an established CRM/marketing suite needs separately designed and verified modules: contact CRM and pipeline, calendars, multichannel messaging, campaign publishing, automation execution, analytics ingestion, payment entitlements, and safe AI tools. These are not substituted with decorative dashboard cards. Define each module's provider, data model, permissions, and acceptance tests before implementation.
