# Priority Lead Niches – Owner Lead Engine

Locked: Personal Injury/MVA, Mortgage/Home Buyers, Business Loans/MCA.

These are the highest-revenue, fastest-return niches based on 2026 market data.

## Implementation status
- Data model and scoring extensions ready in `lib/leads/priority-niches.ts`
- Forms and required fields defined for immediate capture pages
- Automatic routing into owner office by niche (extends existing lead_niches)
- Commercial eligibility flag separate from any loyalty pool

## Next to go live
1. Wire the three form schemas into capture pages or the existing intake flow.
2. Update `classifyNiche` in `lib/leads/engine.ts` to prefer these keys when matching.
3. Ensure owner office leads section filters/groups by these niches.
4. Deploy. No external cost required.

Ava owns configuration and QA once the core desks are active.
