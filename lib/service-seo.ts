/**
 * Search titles for the existing service pages.
 * The body copy still comes from lib/site.ts. These lines only name the
 * search intent and add questions the service page can answer honestly.
 */

export const serviceSeo: Record<
  string,
  { metaTitle: string; metaDescription: string; heading: string; lede: string }
> = {
  seo: {
    metaTitle: "SEO for small businesses",
    metaDescription:
      "Search work for US small businesses: a technical fix list, pages tied to an offer, and reporting that does not promise a rank by a date. DigiMark101 works online, nationwide.",
    heading: "SEO for small businesses",
    lede: "Technical foundation, pages worth ranking, and a readout that separates visibility from revenue. The work is delivered online for clients in the United States. A rank by a date is a guess, so we do not promise one.",
  },
  "paid-ads": {
    metaTitle: "Ads management for small businesses",
    metaDescription:
      "Google and Meta ads management for a small business with one offer. DigiMark101 pairs the ad with the page and does not promise a return on ad spend.",
    heading: "Ads management for small businesses",
    lede: "Search and social ads with an offer, creative, and a budget you can explain. Usually Google and Meta first. We do not publish a return target, because the account has to earn it.",
  },
  social: {
    metaTitle: "Social media marketing agency",
    metaDescription:
      "Social media marketing for small businesses. DigiMark101 plans the channels and the drafts. Posting from inside Studio is not connected yet, so you approve the words and post them.",
    heading: "Social media marketing for small businesses",
    lede: "Organic social with a point of view, a cadence you can keep, and a path back to the offer. Ava can draft the post. Connecting your accounts and posting for you is not live yet.",
  },
  content: {
    metaTitle: "Content marketing for small businesses",
    metaDescription:
      "Landing pages, sales assets, and journal notes for a small business. DigiMark101 writes from approved facts and does not invent proof.",
    heading: "Content marketing for small businesses",
    lede: "Pages and articles that say who the offer is for and what to do next. If a number is not approved, it does not ship.",
  },
  "web-design": {
    metaTitle: "Website design for small businesses",
    metaDescription:
      "Marketing websites for small businesses: a page with a job, a next step, and a launch check for speed and metadata. The visual builder inside Studio is a later phase.",
    heading: "Website design for small businesses",
    lede: "A site that explains the offer and loads fast. The studio designs that as a service. The visual page builder inside the product is a later phase, so a funnel record is not itself a published site.",
  },
  email: {
    metaTitle: "Email marketing for small businesses",
    metaDescription:
      "Welcome notes and campaign drafts for a list you own. In Studio, sending waits until an email provider is connected. DigiMark101 does not pretend a draft was sent.",
    heading: "Email marketing for small businesses",
    lede: "Capture, a welcome, and campaigns for people who asked to hear from you. Studio stores the drafts. Sending starts only after an email provider is connected.",
  },
  analytics: {
    metaTitle: "Marketing analytics for small businesses",
    metaDescription:
      "A short measurement plan for a small business: the events that match the offer, and a monthly note. Studio reports count your own rows. They are not industry benchmarks.",
    heading: "Marketing analytics for small businesses",
    lede: "Five questions, events you can trust, and a readout that ends with a change. We do not borrow someone else's dashboard.",
  },
  "ai-automation": {
    metaTitle: "AI marketing assistant",
    metaDescription:
      "Ava Skye is DigiMark101's AI marketing assistant. She asks one question at a time, fills forms, and saves only after you say yes. She does not send, post, or spend on her own.",
    heading: "AI marketing assistant",
    lede: "Ava Skye drafts, explains, and fills setup forms. You confirm before a change is saved. When the model connection is off, she says so and does not guess.",
  },
}

export const serviceExtraFaqs: Record<string, { question: string; answer: string }[]> = {
  seo: [
    {
      question: "Do you only do SEO in one city?",
      answer:
        "No. DigiMark101 serves small businesses online across the United States. There is no published street address and no city-only package. A multi-location client still needs a page for each place they actually serve, and we do not invent locations.",
    },
    {
      question: "What do I get from an SEO engagement?",
      answer:
        "A technical fix list, page briefs tied to an offer, on-page direction, and a note on what to publish next. Rankings are an outcome we report after the work, not a coupon.",
    },
  ],
  "paid-ads": [
    {
      question: "Do you guarantee a return on ad spend?",
      answer:
        "No. Ads management here means the offer, the account structure, the pairing of ad and page, and a readout of what the spend bought. A promised return would be a guess.",
    },
    {
      question: "Can I start ads before the page is clear?",
      answer:
        "We fix the page first when a stranger cannot tell who the offer is for. Spending before that mostly buys a confused click.",
    },
  ],
  social: [
    {
      question: "Is DigiMark101 a social media marketing agency?",
      answer:
        "The studio plans the channels, the content pillars, and the drafts, and you approve them. Two channels done properly beat six that go quiet. Frequency is a choice in the proposal, not a daily-posting promise.",
    },
    {
      question: "Will Studio post to Instagram or LinkedIn for me?",
      answer:
        "Not yet. Ava drafts posts for Facebook, Instagram, LinkedIn, X, TikTok, YouTube, and Google Business Profile. You copy the draft and post it. Connecting accounts and posting from Studio is marked coming soon.",
    },
  ],
  content: [
    {
      question: "Will you invent statistics to make the page stronger?",
      answer:
        "No. The draft uses facts you approve. Work samples on this site are labeled samples. A client quote goes up only after that person approves the words.",
    },
  ],
  "web-design": [
    {
      question: "Does the website builder inside Studio publish my site?",
      answer:
        "No. Funnel and site records in Studio are plans. The visual builder is a later phase. A website design engagement with the studio is separate: sitemap, design direction, and a launch checklist.",
    },
    {
      question: "Do you design sites for businesses outside your own city?",
      answer:
        "Yes. Clients are served online across the United States. We do not require you to visit an office, and we do not publish a street address.",
    },
  ],
  email: [
    {
      question: "Does creating a campaign in Studio send the email?",
      answer:
        "No. Creating a campaign stores a draft. Sending waits until an email provider is connected. DigiMark101 will not tell you a message went out when it did not.",
    },
  ],
  analytics: [
    {
      question: "Are Studio reports the same as a client case study?",
      answer:
        "No. Studio reports count your own rows: contacts, deals, appointments, campaigns, automations, and memories. They are not industry benchmarks and not other people's sales.",
    },
  ],
  "ai-automation": [
    {
      question: "What can Ava Skye do today?",
      answer:
        "She explains the work, asks setup questions one at a time, fills forms, and drafts a contact, a page, an email, a social post, or an automation. She saves it only after you say yes. Six helpers can draft pages, social posts, ad notes, search outlines, follow-up, and research. They do not send, post, or spend.",
    },
    {
      question: "What happens if the model is not connected?",
      answer:
        "Ava answers through OpenAI when that connection is on. If it is off, she says so and does not guess. She also does not invent clients, testimonials, or performance numbers.",
    },
  ],
}
