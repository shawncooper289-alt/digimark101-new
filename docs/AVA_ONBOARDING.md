# Ava new-account interview

Ava uses `lib/ava/onboarding-playbook.ts` when someone says “set up my account” (or the other start phrases in `isSetupStart`). The same list is in her skill book and on `/studio/knowledge`.

Pronunciation stays in `lib/ava/identity.ts`. This playbook does not change it. Ava is Ay-vuh, long A.

## Order

She asks one question, then waits. The questions cover what to call the person, the business name, niche, location or service area, offer and pricing, target customer, goal, current tools, website, socials, brand colors and logo, booking hours, lead sources, consent needs, and the account email.

## Branching

The niche answer picks a branch:

| Branch | When the answer sounds like | Extra questions |
| --- | --- | --- |
| `local_service` | salon, clinic, contractor, local, home services | service area, booking hours |
| `professional` | consultant, agency, lawyer, software | service area, booking hours |
| `ecommerce` | store, Shopify, retail | where they ship; no booking hours |
| `creator` | coach, course, podcast | booking hours; no street service area |
| `other` | “I don’t know yet” and everything else | service area |

## Skip

A question is skipped when its `client_onboarding` column is already filled, or when the person says skip. “I don’t know yet” is stored as the answer. It is not a skip.

## Confirm before save

After the last question she recaps every answer and the columns it will fill. Nothing is upserted until the person says yes. A correction updates that answer and shows the recap again. The write goes to `client_onboarding` for the signed-in user. A signed-out chat keeps the recap and asks them to sign in, then say yes again.

Social links in the socials answer are copied onto the matching URL column when the text contains an `https://` link. Other words stay in `social_profiles`.

## What gets logged

`onboarding_sessions` stores `question_id`, `outcome` (`completed`, `skipped`, `corrected`), and the niche branch. It does not store the answer, the name, or the email. The signed-in user can insert their own rows. Only `is_owner()` can read them. The office list is on avaskye.online → Beta notes.

Use those counts to drop or rewrite questions that testers skip or correct. Do not put the raw answers in that table.
