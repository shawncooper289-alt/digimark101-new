/**
 * Public site content. Edit this file to change copy, packages, navigation,
 * and the studio email. Do not add client names or performance numbers here
 * unless a real partner has approved them.
 */

export const site = {
  name: "DigiMark101",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.digimark101.com").replace(/\/$/, ""),
  email: "hello@digimark101.com",
  tagline: "Marketing, built as a system.",
  description:
    "DigiMark101 is a digital marketing studio that builds a clear offer, a measurable next step, and the channels to grow around them.",
} as const

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Journal" },
  { href: "/studio", label: "Studio" },
  { href: "/marketplace", label: "Lead lists" },
] as const

export type Service = {
  slug: string
  index: string
  name: string
  short: string
  summary: string
  keywords: string[]
  outcomes: string[]
  includes: string[]
  steps: { title: string; body: string }[]
  faqs: { question: string; answer: string }[]
}

export const services: Service[] = [
  {
    slug: "seo",
    index: "01",
    name: "SEO",
    short: "Search",
    summary:
      "Technical foundation, pages worth ranking, and reporting that separates visibility from revenue.",
    keywords: ["seo", "search", "ranking", "google", "organic"],
    outcomes: [
      "A site search engines can crawl and people can understand.",
      "Pages mapped to real demand, not a keyword spreadsheet with no offer behind it.",
      "A monthly readout of what moved, what did not, and what to publish next.",
    ],
    includes: [
      "Technical audit and fix list",
      "Information architecture and internal linking",
      "Page briefs tied to an offer",
      "On-page writing direction",
      "Search Console and analytics review",
    ],
    steps: [
      { title: "Find the leaks", body: "Crawl, index coverage, speed, and the pages that already earn attention." },
      { title: "Build the map", body: "A small set of pages with a job, written so a buyer and a crawler can both finish the thought." },
      { title: "Read it monthly", body: "Rankings are a clue. The readout tracks queries, pages, and the actions they produced." },
    ],
    faqs: [
      {
        question: "How fast does SEO work?",
        answer:
          "Technical fixes can show up in weeks. New pages usually take longer, and anyone who promises a rank by a date is guessing. We plan the work in quarters and report what actually changed.",
      },
      {
        question: "Do you guarantee first page rankings?",
        answer: "No. We guarantee the work in the proposal: the audits, the pages, and the reporting. Rankings are an outcome, not a coupon.",
      },
    ],
  },
  {
    slug: "paid-ads",
    index: "02",
    name: "Paid ads",
    short: "Media",
    summary: "Search and social media with an offer, creative, and a budget you can explain.",
    keywords: ["ads", "paid", "ppc", "media", "google ads", "meta", "facebook", "roas"],
    outcomes: [
      "Campaigns built around one offer, not a dozen vague objectives.",
      "Creative and landing pages that match the click.",
      "Spend you can pause, defend, or scale because the readout is plain.",
    ],
    includes: [
      "Account structure and tracking check",
      "Offer and audience definition",
      "Ad and landing-page pairing",
      "Weekly budget watch",
      "A monthly decision: hold, fix, or scale",
    ],
    steps: [
      { title: "Make the offer sharp", body: "Ads amplify a promise. If the page cannot say who it is for, we fix that before raising spend." },
      { title: "Launch a small system", body: "A few campaigns with clean names, conversion events, and creative you can tell apart." },
      { title: "Decide in public", body: "Each month we say what the spend bought and what we will stop." },
    ],
    faqs: [
      {
        question: "Which ad platforms do you run?",
        answer:
          "Usually Google and Meta first, then other platforms when the offer and the tracking are ready. The proposal names the platforms. We do not spray budget across every network by default.",
      },
    ],
  },
  {
    slug: "social",
    index: "03",
    name: "Social",
    short: "Social",
    summary: "Organic social with a point of view, a cadence, and a path back to the site.",
    keywords: ["social", "instagram", "linkedin", "tiktok", "organic social", "posts"],
    outcomes: [
      "A voice that sounds like the company on its best day.",
      "A cadence the team can keep.",
      "Posts that point somewhere, not a feed that only performs for itself.",
    ],
    includes: [
      "Channel choice and content pillars",
      "A monthly calendar",
      "Drafts for approval",
      "Profile and highlight structure",
      "A simple report on what earned attention and what earned a click",
    ],
    steps: [
      { title: "Pick the rooms", body: "Two channels done properly beat six channels abandoned." },
      { title: "Write the pillars", body: "Proof, teaching, and offers. Everything else is optional." },
      { title: "Keep the trail", body: "The best posts get a page, an email, or a conversation to land on." },
    ],
    faqs: [
      {
        question: "Do you post every day?",
        answer:
          "Only if the channel and the team can support it. Frequency is a choice in the proposal, not a badge of seriousness.",
      },
    ],
  },
  {
    slug: "content",
    index: "04",
    name: "Content",
    short: "Content",
    summary: "Essays, landing pages, and sales assets that give search and sales something true to use.",
    keywords: ["content", "copy", "writing", "blog", "landing page", "copywriting"],
    outcomes: [
      "Pages that explain the offer without a tour.",
      "A library sales can send.",
      "Search and email finally sharing the same words.",
    ],
    includes: [
      "Messaging workshop",
      "Page and article briefs",
      "Drafts and revisions",
      "Proof inventory, using only approved facts",
      "A publishing queue",
    ],
    steps: [
      { title: "Collect the true things", body: "Claims, offers, and objections. If a number is not approved, it does not ship." },
      { title: "Write the pages that sell", body: "Home, service, and offer pages before a pile of posts." },
      { title: "Then the journal", body: "Articles that answer a real question and link back to the offer." },
    ],
    faqs: [
      {
        question: "Will you write in our voice?",
        answer:
          "Yes. The first weeks include a voice sample and a list of words we will not use. You approve the sample before we scale the writing.",
      },
    ],
  },
  {
    slug: "web-design",
    index: "05",
    name: "Web design",
    short: "Web",
    summary: "Marketing sites designed for clarity, speed, and a next step you can measure.",
    keywords: ["web", "website", "design", "site", "landing", "ux", "build"],
    outcomes: [
      "A site that explains the work in one sitting.",
      "Pages fast enough to keep the click you paid for.",
      "A structure the marketing can grow into.",
    ],
    includes: [
      "Sitemap and page jobs",
      "Design direction",
      "Build in a modern stack",
      "Core templates, not a one-off collage",
      "Launch checklist for speed, metadata, and forms",
    ],
    steps: [
      { title: "Name every page's job", body: "If a page cannot say what the visitor should do next, it is not ready to design." },
      { title: "Design the system", body: "Type, color, and components that the next landing page can reuse." },
      { title: "Launch and instrument", body: "The form, the events, and the speed budget ship with the pages." },
    ],
    faqs: [
      {
        question: "Do you redesign entire companies or single pages?",
        answer: "Both. A single high-intent page is often the right first build. A full site is a Partner or Studio scope, written down before we start.",
      },
    ],
  },
  {
    slug: "email",
    index: "06",
    name: "Email",
    short: "Email",
    summary: "Capture, welcome, campaigns, and simple automations on the list you own.",
    keywords: ["email", "newsletter", "lifecycle", "automation", "klaviyo", "mail"],
    outcomes: [
      "A list with permission and a reason to exist.",
      "A welcome that teaches the offer.",
      "Campaigns tied to a page, not a blast for its own sake.",
    ],
    includes: [
      "Capture points and consent copy",
      "Welcome sequence",
      "Campaign calendar",
      "Basic segments",
      "Deliverability hygiene and a monthly readout",
    ],
    steps: [
      { title: "Earn the address", body: "The offer for the signup has to be as clear as the offer for the sale." },
      { title: "Welcome properly", body: "A short sequence that sets expectations and points to one next step." },
      { title: "Mail with a purpose", body: "Each send has a page, a deadline, or a story. Otherwise it waits." },
    ],
    faqs: [
      {
        question: "Which email platforms do you use?",
        answer:
          "We work in the platform you already have when it is sound. If you are choosing, the proposal names one and why. We do not migrate tools for sport.",
      },
    ],
  },
  {
    slug: "analytics",
    index: "07",
    name: "Analytics",
    short: "Analytics",
    summary: "Events, a dashboard, and a monthly readout of what happened and what to do next.",
    keywords: ["analytics", "measurement", "tracking", "dashboard", "ga4", "data", "report"],
    outcomes: [
      "A short list of events that match the business.",
      "Numbers the team trusts enough to make a decision.",
      "A meeting that ends with a change, not a tour of charts.",
    ],
    includes: [
      "Measurement plan",
      "Event and conversion audit",
      "Dashboard for the questions you actually ask",
      "Monthly narrative readout",
      "A backlog of tracking fixes",
    ],
    steps: [
      { title: "Write the questions", body: "Five questions the business needs answered. Everything else is optional." },
      { title: "Trust the events", body: "We check that a lead, a purchase, or a booked call is the thing being counted." },
      { title: "Narrate the month", body: "What changed, what it cost, and the one move we recommend." },
    ],
    faqs: [
      {
        question: "Can you work with the analytics we already have?",
        answer: "Yes. We start from the current stack and repair it before suggesting new tools.",
      },
    ],
  },
  {
    slug: "ai-automation",
    index: "08",
    name: "AI automation",
    short: "AI",
    summary: "Assistants and workflows that take busywork off the team without pretending a model is the strategy.",
    keywords: ["ai", "automation", "ava", "assistant", "workflow", "gpt", "grok"],
    outcomes: [
      "A named job for the assistant, with a human still accountable.",
      "Drafts, routing, and research that save hours.",
      "A clear line between what the model may say and what the studio will ship.",
    ],
    includes: [
      "Workflow map",
      "Assistant brief and guardrails",
      "A first automation with a human check",
      "Documentation the team can run",
      "A review after the first month",
    ],
    steps: [
      { title: "Pick one painful loop", body: "Briefs, reporting drafts, lead routing, or research. One loop, done properly." },
      { title: "Write the rules", body: "What the assistant may draft, what a person must approve, and which facts it must not invent." },
      { title: "Put it in the week", body: "If the team does not use it by week four, we change the job or stop." },
    ],
    faqs: [
      {
        question: "Is Ava Skye the product we are buying?",
        answer:
          "Ava is the studio assistant on this website and a pattern we can adapt for a client team. A client assistant is scoped on its own, with its own data rules. She does not get the keys to your ad account from a chat window.",
      },
    ],
  },
]

export function getService(slug: string) {
  return services.find((service) => service.slug === slug)
}

export type Package = {
  name: string
  eyebrow: string
  summary: string
  fits: string
  why: string
  includes: string[]
  priceLabel: string
}

export const packages: Package[] = [
  {
    name: "Field",
    eyebrow: "One channel",
    summary: "For a team that needs a single discipline made serious.",
    fits: "You can name the bottleneck.",
    why: "A focused scope makes the first learning clear before you add another moving part.",
    includes: [
      "One primary service",
      "A written monthly plan",
      "The page or offer that channel needs",
      "A monthly readout",
      "Ava for questions between meetings",
    ],
    priceLabel: "Quoted in a proposal",
  },
  {
    name: "Studio",
    eyebrow: "The connected system",
    summary: "For a team whose channels are working, and arguing with each other.",
    fits: "You are ready to run search, media, and a home base together.",
    why: "Shared planning aligns the offer, landing experience, and measurement across disciplines.",
    includes: [
      "Up to three disciplines",
      "Shared monthly planning",
      "Creative and page support",
      "An analytics baseline",
      "One working rhythm across the channels",
    ],
    priceLabel: "Quoted in a proposal",
  },
  {
    name: "Partner",
    eyebrow: "Embedded",
    summary: "For a company that wants the studio inside the week.",
    fits: "Marketing is a core growth function, not a side task.",
    why: "A steady operating rhythm gives a wider system room to learn and adapt without losing accountability.",
    includes: [
      "A scoped mix of all eight disciplines",
      "Quarterly planning",
      "Automation design where it saves real time",
      "A seat in the working week",
      "A proposal that names what we will not take on",
    ],
    priceLabel: "Scoped to the year",
  },
]

export type CaseStudy = {
  slug: string
  index: string
  title: string
  sector: string
  discipline: string
  summary: string
  situation: string
  approach: string[]
  wouldMeasure: string[]
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "search-rebuild",
    index: "A",
    title: "Search rebuild",
    sector: "Search and web · multi-location services",
    discipline: "SEO and web",
    summary: "An offer-led search rebuild: map intent to useful location pages, then measure qualified actions before expanding.",
    situation:
      "When local pages are thin and an offer is hard to find, first separate crawl and indexing issues from relevance and conversion issues. This sequence shows how to reason through the work and define its measures before changes go live.",
    approach: [
      "Check crawlability, duplicates, search demand, and existing landing-page behavior to locate the constraint before rewriting.",
      "Map priority searches to pages with a clear service, location, and next action; do not multiply near-duplicate pages.",
      "Align internal links, useful content, and any paid landing page around the same offer so demand meets a consistent next step.",
      "Define a qualified inquiry and its attribution before launch; review indexed pages, relevant search activity, and qualified organic inquiries over time.",
    ],
    wouldMeasure: ["Indexed offer pages", "Queries that match the service", "Leads attributed to organic landing pages"],
  },
  {
    slug: "launch-media",
    index: "B",
    title: "Launch media",
    sector: "Paid media and analytics · offer launch",
    discipline: "Paid ads and analytics",
    summary: "A launch sequence that connects a clear offer, a relevant landing page, and a conversion event worth trusting.",
    situation:
      "When tracking is uncertain or a landing page leads with the company instead of the offer, more spend makes the read harder. Establish the action to count and make the page match the ad before expanding distribution.",
    approach: [
      "Test conversion tracking against a real completed action before using it to guide budget.",
      "Pair a focused set of ads with a page that states the offer, who it fits, and the next step.",
      "Keep prospecting and remarketing distinct so each audience and message can be understood.",
      "Compare qualified actions and their costs against the agreed source of truth; use the readout to hold, fix, or scale.",
    ],
    wouldMeasure: ["Qualified leads or purchases", "Cost per that action", "Share of spend on ads that earned the action"],
  },
  {
    slug: "lifecycle-notes",
    index: "C",
    title: "Lifecycle notes",
    sector: "Email and content · membership",
    discipline: "Email and content",
    summary: "An owned-channel sequence that makes the signup promise clear, welcomes new members, and gives each send a job.",
    situation:
      "When a signup has no clear welcome and regular email has no defined purpose, begin with the promise made at signup and the next useful action for a new member.",
    approach: [
      "Make the signup promise specific and ensure consent language matches how the list will be used.",
      "Build a short welcome sequence that sets expectations and teaches one useful product action.",
      "Give each campaign one job and a relevant destination instead of sending for frequency alone.",
      "Track welcome completion, clicks to the intended offer, and unsubscribes against sends to guide the next revision.",
    ],
    wouldMeasure: ["Welcome completion", "Campaign clicks to the offer", "Unsubscribes against sends"],
  },
]

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug)
}

export type JournalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }

export type JournalPost = {
  slug: string
  title: string
  description: string
  date: string
  minutes: number
  blocks: JournalBlock[]
}

export const posts: JournalPost[] = [
  {
    slug: "measurement-before-more-spend",
    title: "Put a measurement stack under the next dollar",
    description: "A practical order of operations before a company raises its ad budget or publishes another vanity chart.",
    date: "2026-10-01",
    minutes: 6,
    blocks: [
      {
        type: "p",
        text: "Most marketing arguments are measurement arguments in disguise. One person has a dashboard. Another has a feeling. The spend goes up because the meeting has to end.",
      },
      {
        type: "p",
        text: "DigiMark101 starts the other way. Before a channel is scaled, the studio wants a short stack that a founder and an operator can both read. This note is that stack. It is a method, not a client result.",
      },
      { type: "h2", text: "Five questions, not fifty charts" },
      {
        type: "p",
        text: "Write the questions the business actually asks. A useful set is small:",
      },
      {
        type: "ul",
        items: [
          "How many people reached the offer?",
          "How many took the action that pays the bills?",
          "What did that action cost, by channel?",
          "Which message did they see first?",
          "What will we stop if the number disappoints?",
        ],
      },
      {
        type: "p",
        text: "If a chart does not help answer one of those, it can wait. A dashboard that requires a tour is a brochure.",
      },
      { type: "h2", text: "Trust the event before you trust the story" },
      {
        type: "p",
        text: "Pick the action that matters: a qualified lead, a booked call, a purchase, a started trial. Then submit it yourself. If the analytics tool does not record the same thing a human just did, the channel is not ready to scale. Fix the event, the thank-you page, and the definition of qualified. Then talk about budget.",
      },
      { type: "h2", text: "Name the source of truth" },
      {
        type: "p",
        text: "Ad platforms grade their own homework. That is useful for creative decisions inside the platform and a poor way to run the company. Choose one place, usually the analytics tool plus the CRM, where a lead is a lead. Say it in the monthly note so nobody swaps definitions halfway through the quarter.",
      },
      { type: "h2", text: "The monthly note" },
      {
        type: "p",
        text: "A readout can be one page. What changed. What it cost. What we believe caused it. What we will do next. What we will not do. Ava Skye can draft that note from approved numbers. She should not be handed a blank chart and asked to invent the cause.",
      },
      {
        type: "p",
        text: "When the stack is this small, raising spend is a decision instead of a ritual. That is the whole point of the analytics practice.",
      },
    ],
  },
  {
    slug: "how-to-brief-ava-skye",
    title: "How to brief Ava Skye",
    description: "The studio assistant is useful when the job is specific. Here is how to ask, and what she will refuse to invent.",
    date: "2026-10-08",
    minutes: 5,
    blocks: [
      {
        type: "p",
        text: "Ava Skye is DigiMark101's studio assistant. On this website she answers questions about the work, the packages, and how to start. With an API key she answers from a live model. Without one, she answers from a studio guide so the page still helps.",
      },
      { type: "h2", text: "Give her a job, a reader, and a limit" },
      {
        type: "p",
        text: "A useful brief has three lines. Who the reader is. What they should do next. What Ava must not claim. “Write a homepage for a clinic group that books first visits, and do not invent patient counts” will outperform “make it pop.”",
      },
      {
        type: "ul",
        items: [
          "Name the audience in plain language.",
          "Name the single next step.",
          "Paste the facts she is allowed to use.",
          "Say which facts are missing so she asks instead of filling the gap.",
        ],
      },
      { type: "h2", text: "What she will not do" },
      {
        type: "p",
        text: "Ava does not invent client names, testimonials, or performance statistics. Client results are published only after partner approval. She also does not send the email, charge a card, or change an ad account from the chat. A person does those things.",
      },
      { type: "h2", text: "Use her before the form" },
      {
        type: "p",
        text: "If you are not sure whether you need search, media, or a page, ask her. Then send the contact form with the answer you want the studio to pressure-test. The form is how a human gets the note. The chat is how the note gets sharper.",
      },
      {
        type: "p",
        text: "Treat her first draft as a draft. The studio's standard is that a person remains accountable for anything a customer sees.",
      },
    ],
  },
  {
    slug: "the-order-we-turn-channels-on",
    title: "The order we usually turn channels on",
    description: "Eight disciplines do not start on the same Monday. This is the sequence DigiMark101 uses when a company is beginning.",
    date: "2026-10-15",
    minutes: 7,
    blocks: [
      {
        type: "p",
        text: "An all-in-one studio is not an invitation to launch eight channels in a week. DigiMark101 keeps all eight available so the system can be designed together, then turns them on in an order the team can sustain.",
      },
      { type: "h2", text: "1. The offer and the page" },
      {
        type: "p",
        text: "If a stranger cannot tell who the work is for, why it is worth choosing, or what to do next, every channel will tax that confusion. Make the desired outcome concrete, strengthen the reasons to believe it, and reduce unnecessary time or effort to act. Web and content come first when the site is the bottleneck.",
      },
      { type: "h2", text: "2. The measurement" },
      {
        type: "p",
        text: "Analytics is not the reward for a mature program. It is the light you turn on before spending. One trusted conversion is enough to start.",
      },
      { type: "h2", text: "3. The channel that can learn this month" },
      {
        type: "p",
        text: "Start with warm outreach when the team can have relevant conversations. Publish useful content to build a durable signal, then use targeted cold outreach where it fits. Paid media follows when the offer, page, and measurement can support the spend. Search compounds over time; email serves people who have already opted in. We choose based on the bottleneck, not fashion.",
      },
      { type: "h2", text: "4. The supporting voice" },
      {
        type: "p",
        text: "Social and the journal come after there is a page worth sending people to. They are how a company sounds in public. They are a weak substitute for an offer.",
      },
      { type: "h2", text: "5. The automation" },
      {
        type: "p",
        text: "AI automation is last in the sequence and early in the design. Ava can draft, sort, and remind once the team knows which loop is painful. Automating a messy offer just produces messy drafts faster.",
      },
      {
        type: "p",
        text: "Studio and Partner packages exist for companies that are past step one. Field exists so nobody has to pretend they need everything on day one. If you want this sequenced for your business, start with the contact form or ask Ava to sketch the order.",
      },
    ],
  },
]

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug)
}

export const homeFaqs = [
  {
    question: "What does DigiMark101 do?",
    answer:
      "We plan, make, and measure digital marketing across eight disciplines: SEO, paid ads, social, content, web design, email, analytics, and AI automation. Engagements are scoped as Field, Studio, or Partner.",
  },
  {
    question: "Do you publish client results?",
    answer:
      "No client results are published here yet. The work pages explain our approach; client names and outcomes appear only after the partner approves the facts and context.",
  },
  {
    question: "Who is Ava Skye?",
    answer:
      "Ava is the studio assistant. She can talk through services, packages, and a starting brief. With an API key she uses a live language model. Without one, she answers from a studio guide. She does not invent proof or change your accounts.",
  },
  {
    question: "How do we start?",
    answer:
      "Send a note through the contact form with your site, the channel that feels stuck, and what a good quarter would look like. If lead storage is not connected yet, the form tells you and offers email instead of pretending the note was saved.",
  },
  {
    question: "Do you work in one channel or the whole system?",
    answer:
      "Either. Field is one discipline. Studio connects up to three. Partner scopes the wider system. We would rather run a small system well than launch everything at once.",
  },
  {
    question: "Where do leads and chats go?",
    answer:
      "Leads are stored in Supabase when the service role key is configured. Ava's live replies are produced by xAI or OpenAI, depending on which key you add. Neither is contacted when the keys are absent.",
  },
] as const

export const method = [
  {
    index: "01",
    title: "Name the bottleneck",
    idea: "Growth gets easier to reason about when one constraint is named before more activity is added.",
    how: "Review the offer, customer journey, and current signals with the team, then choose the page, channel, or measurement gap to address first.",
    why: "A bounded first move helps the team see what changed and keeps effort on a real business problem.",
  },
  {
    index: "02",
    title: "Make the system small",
    idea: "Traffic is more useful when it meets a clear offer and a next step the team can fulfill.",
    how: "Clarify the promise and page, verify the conversion event, then work through warm outreach, useful public content, targeted cold outreach, and paid distribution as the offer and measurement are ready.",
    why: "This sequence moves from direct conversations to wider reach while keeping the offer credible, the next step clear, and the time or effort asked of a buyer reasonable.",
  },
  {
    index: "03",
    title: "Read it out loud",
    idea: "Measurement earns its place when it changes the next decision, not when it fills a dashboard.",
    how: "Agree on the action and source of truth, review the cost and quality of response, then record what changed and what to try next.",
    why: "A short, consistent readout makes uncertainty visible and helps a team scale only what its evidence supports.",
  },
] as const

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}
