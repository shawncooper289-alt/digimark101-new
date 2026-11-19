/**
 * National, online agency pages. Copy is limited to capabilities in the product
 * and the studio service list. No city, no review, no lead-volume claim.
 */

export type AgencyFaq = { question: string; answer: string }

export type AgencyPage = {
  slug: string
  path: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  heading: string
  lede: string
  sections: { heading: string; paragraphs: string[] }[]
  links: { href: string; label: string; body: string }[]
  faqs: AgencyFaq[]
}

export const agencyPages: AgencyPage[] = [
  {
    slug: "small-business",
    path: "/agency/small-business",
    metaTitle: "Digital marketing for small businesses",
    metaDescription:
      "Digital marketing for US small businesses, delivered online. One offer, one next step, and a workspace you keep. Ava Skye sets it up with you. A beta seat is free for testers.",
    eyebrow: "Small businesses",
    heading: "Digital marketing for small businesses",
    lede: "DigiMark101 is built first for a small business or solo operator with one offer, anywhere in the United States. The work is remote. You do not visit an office. You get a plan for the marketing and a workspace that keeps the people, the page, and the follow-up.",
    sections: [
      {
        heading: "What you can run from one login",
        paragraphs: [
          "Studio holds contacts, a pipeline, a calendar, email drafts, page and funnel records, social drafts, files, and automations. Ava Skye asks one question at a time, fills the forms, and saves only after you say yes.",
          "Email sending waits on an email provider. Texting from inside the app is not connected. Phone calls can be placed by the owner, only to a number on an approved list, and only after that person agreed. The visual page builder is a later phase, so a funnel record is a plan, not a live site. Social posting from Studio is coming soon. You copy a draft and post it yourself until then.",
        ],
      },
      {
        heading: "How an engagement usually starts",
        paragraphs: [
          "Name the offer and the person it is for. Then pick the channel that can learn this month: a page, search, ads, or email to people who already asked to hear from you. Field is one discipline. Studio, the package, connects up to three. Partner is a seat in the week. The fee is written in a proposal, not guessed on this page.",
          "If you want to try the software before a proposal, a beta seat is free for testers. The form sends an email sign-in link and does not start a PayPal payment.",
        ],
      },
    ],
    links: [
      { href: "/services/seo", label: "SEO", body: "A fix list and pages tied to the offer. No rank-by-date promise." },
      { href: "/services/web-design", label: "Website design", body: "A page with one job and a launch check for speed and metadata." },
      { href: "/services/paid-ads", label: "Ads management", body: "Google and Meta, with the page and the tracking checked first." },
      { href: "/services/social", label: "Social media", body: "A cadence and drafts you approve. Posting from Studio is not live yet." },
      { href: "/beta", label: "Free beta seat", body: "Use the workspace yourself. The seat is free while the product is in testing." },
      { href: "/contact", label: "Talk to a person", body: "Send the site, the channel that feels stuck, and what a good quarter would look like." },
    ],
    faqs: [
      {
        question: "Do you work with small businesses outside one city?",
        answer:
          "Yes. DigiMark101 serves clients online across the United States. There is no published street address and no requirement to meet in person.",
      },
      {
        question: "What does a small business get that a pile of tools does not?",
        answer:
          "Contacts, the path of a sale, email drafts, page plans, social drafts, files, and reminders share one login. Ava fills the setup and waits for your yes. Where a feature is not connected yet, the page says so.",
      },
      {
        question: "Do you guarantee leads or revenue?",
        answer:
          "No. Income depends on your offer, your effort, and the people you reach. DigiMark101 does not pay you and does not publish a lead count.",
      },
      {
        question: "Can I try it before I hire the studio?",
        answer:
          "Yes. A beta seat is free for testers. Use the email you check. There is no PayPal step on that form. If an invite code is required, the form says so.",
      },
    ],
  },
  {
    slug: "lead-generation",
    path: "/agency/lead-generation",
    metaTitle: "Lead generation for small businesses",
    metaDescription:
      "Lead generation for US small businesses: a page with one next step, a contact list, and follow-up drafts. DigiMark101 does not sell a guaranteed lead volume. List checkout is not connected.",
    eyebrow: "Lead generation",
    heading: "Lead generation for small businesses",
    lede: "A lead is a person who took a step you can name: a form, a reply, a booked conversation. DigiMark101 helps you build that step and keep the record. It does not promise a number of leads per month.",
    sections: [
      {
        heading: "What is actually wired",
        paragraphs: [
          "The public contact form stores a note when you consent to be contacted. A job can score leads and sort them by topic. The public lead list shows the niche, region, company size, and score. Names, emails, and phone numbers stay hidden until an order is paid. People can opt out. Checkout for a list is not connected, so a request stays pending until it is marked paid.",
          "Inside your own workspace, contacts and a pipeline (new, qualified, proposal, won, lost) keep the people you already know. Email follow-up can be drafted. Sending waits until an email provider is connected. Calendar booking lives in Studio. It is not a public scheduling link for your customers yet.",
        ],
      },
      {
        heading: "What the studio will and will not propose",
        paragraphs: [
          "A proposal can include the page, the form, the measurement, and the follow-up. It will not include a guaranteed lead volume, a purchased list of private phone numbers, or a claim that Studio already dials or texts those people. Texting is not connected. A phone call happens only when the owner starts it, the person agreed, and the number is on the approved list.",
        ],
      },
    ],
    links: [
      { href: "/contact", label: "Start with the contact form", body: "Tell us the offer and the action that should count as a lead." },
      { href: "/marketplace", label: "How public lead lists work", body: "Niche, region, size, and score. Personal details stay hidden." },
      { href: "/services/paid-ads", label: "Ads that ask for the lead", body: "Spend only after the page and the conversion event are clear." },
      { href: "/services/seo", label: "Search pages that can rank", body: "Pages mapped to real demand, not a keyword sheet with no offer." },
      { href: "/services/email", label: "Follow-up drafts", body: "Welcome and campaign drafts. Sending is not connected yet." },
      { href: "/start", label: "First campaign template", body: "Five questions, then a draft of one page, one form, and three emails. Approving saves it. It does not send." },
    ],
    faqs: [
      {
        question: "Will you guarantee a number of leads?",
        answer:
          "No. Anyone who promises a lead count before seeing the offer, the page, and the tracking is guessing. The proposal names the work. The count is something we measure after it is live.",
      },
      {
        question: "Can I buy a list of emails and phone numbers here?",
        answer:
          "Public lists are anonymized: niche, region, company size, and score. Personal details stay hidden until an order is paid, and checkout for a list is not connected. Opt out is available. DigiMark101 does not hand out a raw phone list from this page.",
      },
      {
        question: "Do you call the leads for me?",
        answer:
          "Texting is not connected. A phone call is placed only by the owner, only after the person agreed, and only to a number on the approved list. DigiMark101 will not claim a call or a text was made when it was not.",
      },
      {
        question: "What should I hire first if I need leads?",
        answer:
          "Usually the page and the event that counts as a lead, then one channel: search, ads, or email to people who already opted in. The contact form is how a human at the studio gets that brief.",
      },
    ],
  },
  {
    slug: "ai",
    path: "/agency/ai",
    metaTitle: "AI marketing agency",
    metaDescription:
      "An AI marketing assistant for US small businesses. Ava Skye asks one question at a time, fills the forms, and saves only after you say yes. She does not send, post, or spend on her own.",
    eyebrow: "AI marketing",
    heading: "An AI marketing assistant that waits for yes",
    lede: "Ava Skye is the assistant on this site and inside Studio. Her name is pronounced AY-vuh. She is not a substitute for the offer, and she does not invent proof. The studio still does the marketing. Ava sets up the workspace beside you.",
    sections: [
      {
        heading: "What Ava does",
        paragraphs: [
          "She explains the eight kinds of marketing work, asks setup questions one at a time, and fills the forms on the screen. You check the draft and say yes. That confirm step is required before a change is stored.",
          "You can talk or type. Sound starts when you tap. The page does not play her voice on its own. For a longer draft, six helpers can work with her: pages and offers, social posts, ad notes, search outlines, follow-up, and research. A seventh job waits until one finishes. The helpers do not send, post, or spend.",
        ],
      },
      {
        heading: "What she will not do",
        paragraphs: [
          "She answers through OpenAI when that connection is on. If it is off, she says so and does not guess. She does not invent client names, testimonials, or performance numbers. She does not send the email, charge a card, or change an ad account from the chat. A person does those things.",
          "A finished video of Ava can be prepared when the avatar and video keys are set. Without those keys you can still make a labeled preview draft. The homepage does not embed a fake film.",
        ],
      },
    ],
    links: [
      { href: "/ava", label: "Talk to Ava", body: "Open the assistant. She will not invent a result to win the conversation." },
      { href: "/services/ai-automation", label: "AI automation as a service", body: "One painful loop, a human check, and rules for what the model may say." },
      { href: "/beta", label: "Try her on a free beta seat", body: "The seat is free for testers and does not start a payment." },
      { href: "/blog/how-to-brief-ava-skye", label: "How to brief Ava", body: "Give her a reader, a next step, and the facts she is allowed to use." },
      { href: "/agency/small-business", label: "Who the hero is for", body: "Small businesses and solo operators with one offer, served online in the US." },
      { href: "/contact", label: "Ask a person", body: "A human reads the contact form. Ava can help you write the note first." },
    ],
    faqs: [
      {
        question: "Is DigiMark101 an AI marketing agency?",
        answer:
          "It is a digital marketing studio with an AI assistant. The studio work is the eight disciplines, quoted in a proposal. Ava sets up the workspace and drafts. You confirm before she saves. She is not an autopilot for your ad account.",
      },
      {
        question: "Does Ava post, email, or buy ads by herself?",
        answer:
          "No. She drafts. Sending email waits on an email provider. Posting to social networks is coming soon. Ad platforms are not connected, and she does not spend. Phone and text are not connected.",
      },
      {
        question: "Which model answers?",
        answer:
          "OpenAI, when that connection is on. If it is off, Ava says so and does not fill the gap with a made-up answer.",
      },
      {
        question: "Can I use Ava before I create an account?",
        answer:
          "You can open Ava from the Ava page and read the site. A free beta seat saves the workspace to your login. The beta form uses an email sign-in link and does not start a PayPal payment.",
      },
    ],
  },
]

export function getAgencyPage(slug: string) {
  return agencyPages.find((page) => page.slug === slug)
}

export const agencyHubFaqs: AgencyFaq[] = [
  {
    question: "Is DigiMark101 an online digital marketing agency?",
    answer:
      "Yes. DigiMark101 is a digital marketing studio for small businesses in the United States, and the work is delivered online. Search, paid ads, social, content, web design, email, analytics, and AI automation can be planned together. You can also use the Studio workspace yourself, with Ava Skye setting it up beside you.",
  },
  {
    question: "Do I need to live near your office?",
    answer:
      "No. Clients are remote. We do not publish a street address. The service area in the structured data is the United States.",
  },
  {
    question: "How much does the agency cost?",
    answer:
      "Field, Studio, and Partner are quoted in a proposal. Membership prices for the software are on the pricing page and renew until you cancel in PayPal. This page does not invent a package price.",
  },
  {
    question: "What is free?",
    answer:
      "A beta seat for testers is free. The form sends a sign-in link and does not start a PayPal payment. If an invite code is required, the form says so. Agency work is not the same thing as the beta seat.",
  },
  {
    question: "What will you refuse to claim?",
    answer:
      "A rank by a date, a return on ad spend, a lead volume, a client quote, or a revenue number, unless a real partner has approved the facts. Work pages on this site are labeled samples.",
  },
]
