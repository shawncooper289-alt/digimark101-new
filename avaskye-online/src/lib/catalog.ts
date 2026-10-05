export const SITE = {
  name: "Ava Skye",
  host: "https://avaskye.online",
  agency: "https://digimark101-new-umber.vercel.app",
  agencyPricing: "https://digimark101-new-umber.vercel.app",
  agencyApp: "https://digimark101-new-umber.vercel.app",
};

export const PLANS = [
  { id: "starter", name: "Starter", price: 27, credits: 500, who: "Per licensed person", gets: ["500 monthly credits", "Full Ava knowledge and creative skills", "Emails, social posts, writing, ideas and next actions", "Copy and paste outputs manually"] },
  { id: "creator", name: "Creator", price: 50, credits: 1500, who: "Per licensed person", gets: ["1,500 monthly credits", "Same full Ava knowledge and skills", "More capacity for regular content creation", "Copy and paste outputs manually"] },
  { id: "power", name: "Power", price: 89, credits: 4000, who: "Per licensed person", gets: ["4,000 monthly credits", "Same full Ava knowledge and skills", "More capacity for intensive creative work", "Copy and paste outputs manually"] },
] as const;
export const PACKS = [{price:10, credits:300}, {price:25, credits:900}, {price:50, credits:2000}] as const;

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
