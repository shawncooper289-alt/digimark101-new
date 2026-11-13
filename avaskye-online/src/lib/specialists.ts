/** Owner-only labels for the helpers clients never see. Ids match the public app. */
export const OFFICE_HELPERS = [
  {
    id: "copywriter",
    title: "Copywriter",
    scope: "Writes pages, offers, captions, and email drafts. Does not publish or send.",
  },
  {
    id: "social",
    title: "Social scheduler",
    scope: "Drafts posts and dates. Does not publish them.",
  },
  {
    id: "ads",
    title: "Ads analyst",
    scope: "Drafts an ad note from numbers you already have. Does not spend.",
  },
  {
    id: "seo",
    title: "Website helper",
    scope: "Drafts page outlines. Does not publish a site.",
  },
  {
    id: "followup",
    title: "Follow-up helper",
    scope: "Drafts customer notes and email drafts. Does not email or text anyone.",
  },
  {
    id: "research",
    title: "Research helper",
    scope: "Summarizes only the facts in the brief. Does not invent numbers.",
  },
] as const

export const MAX_HELPERS_AT_ONCE = 6
