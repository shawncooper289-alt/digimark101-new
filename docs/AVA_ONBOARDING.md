# Ava new-account interview

A new client starts at `/studio/setup` after signup. Two paths share one draft:

- **I'll fill it in.** A step-by-step form.
- **Just talk with Ava.** The floating widget asks one question at a time. Voice speaks the questions and listens when Voice is on. Typing still works.

Switching paths does not clear answers. Both write `client_onboarding` for the signed-in user, and only after confirm.

Ava uses `lib/ava/onboarding-playbook.ts` when someone says “set up my account” (or the other start phrases in `isSetupStart`). The same list is in her skill book and on `/studio/knowledge`.

Pronunciation stays in `lib/ava/identity.ts`. This playbook does not change her voice, the speech rate, or the TTS voice. Ava is Ay-vuh, long A.

## What she asks

One question, then she waits. She follows what the person just said and skips a question she can already answer. The questions cover what to call them, the business name, what they do, where they are or where they ship, the offer and price, who the customers are, the goal, what is slowing the business down, the tools they use, the website, social pages, how the brand should feel, booking hours when that fits, where customers come from, email consent, and the account email.

Budget is not an account-setup field. A rough time frame can go in the goal. The public contact form has its own budget list.

If they have nothing slowing the business down, or they don't know, she says so and saves `No main roadblock yet; Ava will help find one`. She still writes a first growth plan from the goal. The plan does not invent numbers.

## Branching

The “what you do” answer picks a branch:

| Branch | When the answer sounds like | Extra questions |
| --- | --- | --- |
| `local_service` | bakery, roofer, salon, clinic, contractor | where they are, booking hours |
| `professional` | consultant, agency, lawyer, software | where they are, booking hours |
| `ecommerce` | store, Shopify, retail | where they sell; no booking hours |
| `creator` | coach, course, podcast | booking hours; no street address |
| `other` | “I don’t know yet” and everything else | where they are |

## Skip

A question is skipped when its column is already filled, when she can tell it from an earlier answer, or when the person says skip. “I don’t know yet” is stored. It is not a skip.

## Confirm before save

After the last question she shows every answer and the growth plan. The form shows the same summary for editing. Nothing is upserted until they confirm. A correction updates that answer and shows the summary again. A signed-out chat keeps the summary and asks them to sign in, then confirm again.

Social links are copied onto the matching URL column when the text contains an `https://` link. Other words stay in `social_profiles`.

## What gets logged

`onboarding_sessions` stores `question_id`, `outcome` (`completed`, `skipped`, `corrected`), and the niche branch. It does not store the answer, the name, or the email. The signed-in user can insert their own rows. Only `is_owner()` can read them. The office list is on avaskye.online → Beta notes.

Use those counts to drop or rewrite questions that testers skip or correct. Do not put the raw answers in that table.
