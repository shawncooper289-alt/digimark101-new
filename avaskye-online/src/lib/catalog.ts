export const SITE = {
  name: "Ava Skye",
  host: "https://avaskye.online",
  agency: "https://www.digimark101.com",
  agencyPricing: "https://www.digimark101.com/pricing",
  agencyApp: "https://www.digimark101.com/app",
};

export const PLANS = [
  {
    id: "starter",
    name: "Starter Ava",
    price: 49,
    prompts: 40,
    who: "One brand, content only",
    gets: [
      "Posts, emails, pages, and offer lines",
      "40 prompts each month",
      "One brand voice",
      "Drafts you approve before anything sends",
    ],
  },
  {
    id: "pro",
    name: "Pro Ava",
    price: 149,
    prompts: 200,
    who: "Content plus automation drafts",
    gets: [
      "Everything in Starter",
      "200 prompts each month",
      "Follow-up sequences and workflow drafts",
      "Three brand voices",
      "Prompt packs stack on top",
    ],
  },
] as const;

export const PACK = { id: "pack-50", name: "50 extra prompts", price: 29, prompts: 50 };

export const SEATS = [
  { id: "starter", name: "Starter", price: 97, who: "One founder", gets: "Full Starter belt on DigiMark101. Ava guides and carries the next move." },
  { id: "growth", name: "Growth Team", price: 297, who: "Weekly publisher", gets: "Starter tools plus phone, webinars, reputation, portal, video-ad prep, affiliates." },
  { id: "agency", name: "Agency Command", price: 997, who: "Agency or multi-client", gets: "Growth tools plus client workspaces, snapshots, white-label, platform command." },
];

export function draftFor(kind: string, brief: string) {
  const topic = brief.trim() || "the offer";
  if (kind === "automation") {
    return [
      `Trigger: someone opts in for ${topic}.`,
      "Wait 10 minutes. Send the delivery sentence and one next step.",
      "If no reply in 2 days, send one proof point and a booking link.",
      "If they book, stop the sequence. If they buy, tag won and hand the seat upgrade to DigiMark101.",
    ].join("\n");
  }
  if (kind === "email") return `Subject: ${topic}\n\nYou do not need a bigger stack. You need the next asset finished.\n\nAva can draft that page, the follow-up, and the booking line. Approve it, then send it.`;
  if (kind === "page") return `Headline: ${topic}\nSub: Built with Ava. Approved by you.\nProof: one result, one sentence.\nOffer: Starter Ava drafts the content. Pro Ava drafts the follow-up too.\nButton: Start with Ava.`;
  return `Post\n${topic}\n\nMost teams buy a tool and still stare at a blank page.\nAva writes the first draft. You keep the send button.\nStarter for content. Pro when you want the sequence too.`;
}
