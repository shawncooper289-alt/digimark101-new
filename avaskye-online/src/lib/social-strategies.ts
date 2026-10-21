export type SocialPlay = {
  id: string
  platform: "facebook" | "tiktok" | "instagram" | "youtube"
  type: "post" | "short" | "banner" | "story"
  name: string
  cadence: string
  goal: string
  steps: string[]
  example: string
}

/** Free organic only. No paid spend. Ready for the owner to post or queue. */
export const SOCIAL_PLAYS: SocialPlay[] = [
  {
    id: "fb-value-post",
    platform: "facebook",
    type: "post",
    name: "Facebook value post",
    cadence: "3–5× per week",
    goal: "Build trust with business owners, then soft invite",
    steps: [
      "Open with a single specific problem a founder has this week",
      "Give one clear move they can do in under 15 minutes",
      "End with a question or a link to digimark101.com/studio or Ava chat",
      "Reply to every comment in the first hour",
    ],
    example: "Most agencies waste the first week rewriting the offer. Here is the one sentence that actually gets replies…",
  },
  {
    id: "fb-group-share",
    platform: "facebook",
    type: "post",
    name: "Facebook group value share",
    cadence: "2–3× per week in relevant groups",
    goal: "Help first, invite second",
    steps: [
      "Answer a real question already in the group",
      "Add one extra useful detail",
      "Only mention DigiMark101 if it directly solves the problem",
      "Never spam the same post across groups",
    ],
    example: "You can book the call without a full funnel. Here is the exact booking page copy that works.",
  },
  {
    id: "ig-reel",
    platform: "instagram",
    type: "short",
    name: "Instagram Reel / short",
    cadence: "Daily or 5× per week",
    goal: "Reach new founders with one tip + CTA",
    steps: [
      "Hook in the first 1.5 seconds (text on screen + spoken)",
      "One tip, under 30 seconds",
      "On-screen CTA: “Chat with Ava” or “digimark101.com”",
      "Post as Reel, share to Stories, pin the best ones",
    ],
    example: "Stop rewriting your homepage. Use this one line that turns visitors into booked calls.",
  },
  {
    id: "ig-carousel",
    platform: "instagram",
    type: "post",
    name: "Instagram carousel",
    cadence: "2–3× per week",
    goal: "Save-worthy breakdowns",
    steps: [
      "Slide 1: bold claim or question",
      "Slides 2–6: one point each, large text",
      "Last slide: next step + link in bio",
      "Caption repeats the hook and asks a question",
    ],
    example: "5 things that are killing your close rate (and the one fix).",
  },
  {
    id: "tt-short",
    platform: "tiktok",
    type: "short",
    name: "TikTok short",
    cadence: "Daily",
    goal: "Discovery with fast, specific tips",
    steps: [
      "Text hook on screen immediately",
      "Speak the tip in plain language",
      "End with “Comment ‘Ava’ and I’ll send the template” or profile link",
      "Post at consistent times; reply to comments fast",
    ],
    example: "Your offer is too vague. Say this instead.",
  },
  {
    id: "yt-short",
    platform: "youtube",
    type: "short",
    name: "YouTube Short",
    cadence: "4–7× per week",
    goal: "Funnel viewers to longer videos or the studio",
    steps: [
      "Same short style as TikTok/Reels",
      "Add “Full breakdown on the channel” or “Link in description”",
      "Pin a comment with the DigiMark101 link",
      "Reuse the best-performing Shorts as long-form outlines",
    ],
    example: "The one email that books more calls than a 27-email sequence.",
  },
  {
    id: "yt-long",
    platform: "youtube",
    type: "post",
    name: "YouTube long-form outline",
    cadence: "1× per week",
    goal: "Authority + search traffic",
    steps: [
      "Title that includes the outcome",
      "First 30 seconds: the problem and the promise",
      "3–5 clear sections with examples",
      "End with one next step to digimark101.com",
    ],
    example: "How I run a digital marketing business with one operator and Ava.",
  },
  {
    id: "banner-pack",
    platform: "instagram",
    type: "banner",
    name: "Banner / profile pack",
    cadence: "Refresh monthly",
    goal: "Consistent look across platforms",
    steps: [
      "Profile photo: Ava face, clean crop",
      "Banner: one clear line + digimark101.com",
      "Highlight covers: Offer, Studio, Results, Ava",
      "Keep the same face and gold/dark palette",
    ],
    example: "Own the system. Build the dynasty. — digimark101.com",
  },
]

export function playsFor(platform: string) {
  return SOCIAL_PLAYS.filter((p) => p.platform === platform)
}
