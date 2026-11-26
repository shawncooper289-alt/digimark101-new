/**
 * Homepage copy for the public marketing site.
 * Describe only what the product code can do. No client counts, awards,
 * testimonials, prices, or income promises belong in this file.
 */

export const hero = {
  eyebrow: "Your marketing workspace, guided by Ava",
  lead: "Your Digital Dynasty starts here",
  accent: "Ava walks with you from first question to finished draft. Everything you create stays in your account.",
  lede:
    "Contacts, pipeline, drafts, files, and follow-ups live in one place. No more jumping between tools. You keep everything you build.",
  offer:
    "Free beta for testers. Sign in with the email you check. Your work is saved to your login and stays yours.",
} as const

export const trustFacts = [
  {
    title: "You keep what you build",
    body: "Every contact, draft, file, and note is saved under your login. Beta testers keep everything they create.",
  },
  {
    title: "Guided, not overwhelming",
    body: "Ava asks one clear question at a time and fills the form. You review and confirm before anything is stored.",
  },
  {
    title: "One clean workspace",
    body: "People, sales stages, drafts, files, and reminders share a single login. No more scattered tools.",
  },
  {
    title: "Honest and clear",
    body: "We label samples. We do not invent client results or numbers. What you see is what the product does today.",
  },
] as const

export const earningsDisclaimer =
  "Earnings disclaimer: DigiMark101 helps you do the marketing work. Income is not guaranteed. What you make depends on your offer, your effort, and the people you reach."

export const pageLinks = [
  { href: "#why-now", label: "Why now" },
  { href: "#who", label: "Who it is for" },
  { href: "#film", label: "Film" },
  { href: "#what", label: "What it is" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#plans", label: "Plans" },
  { href: "#faq", label: "Questions" },
] as const

export const audiencePaths = [
  {
    name: "Local businesses",
    href: "/agency/small-business",
    cta: "Digital marketing for small businesses",
    body: "You have one offer and you want people to find it and take the next step. Search, ads, the site, and email are the map. Calling and texting from inside the app are not connected yet.",
  },
  {
    name: "Beginners",
    href: "/start",
    cta: "See the first campaign",
    body: "You have one offer and you are not sure which screen to open. The first campaign asks five questions, then drafts one page, one form, and three emails. You approve it. Approving saves the draft. It does not publish or send yet.",
  },
  {
    name: "Creators",
    href: "/services/content",
    cta: "Content and social drafts",
    body: "You already publish. Studio keeps the people, the files, and the drafts in one login. Ava can draft a post. Posting to the networks for you is not connected yet, so you copy the draft and post it yourself.",
  },
  {
    name: "Agencies",
    href: "/contact",
    cta: "Write to the studio",
    body: "You run marketing for clients. Studio holds a pipeline, drafts, and files. A white-label backend under your own name is coming soon. Hire the studio when you want the work done with you.",
  },
] as const

export const moneySteps = [
  {
    title: "Choose one offer",
    body: "Pick one thing a specific person can pay for: a service, a product, or help you give a local business. Ava helps you write that sentence. She will only use facts you give her.",
  },
  {
    title: "Name who it is for",
    body: "Say who you want to reach, in ordinary words. Save the business details in Studio when you are ready. Ava can fill that form. You confirm it before it is stored.",
  },
  {
    title: "Keep the people who want to hear from you",
    body: "Add them as contacts. A CRM is that list, with a memory of who they are. The leads engine can also score leads who gave permission, and sort them by topic. Public lists show the topic, region, company size, and score. Names, emails, and phone numbers stay hidden until an order is paid. Asking for a list does not charge a card, because checkout is not connected yet.",
  },
  {
    title: "Give them one next step",
    body: "A funnel is a page with one job, then a follow-up, then the offer. Plan that page in Funnels, or store the links in Builds. Saving the record does not publish a site. The visual page builder is a later phase.",
  },
  {
    title: "Follow up",
    body: "Draft the email in Studio, and keep an email list. A campaign you create stays a draft. Sending starts only after an email provider is connected. Until then, the pipeline shows where each person is: new, qualified, proposal, won, or lost. A pipeline is the path of a sale.",
  },
  {
    title: "Get paid, then read your own numbers",
    body: "Your customers pay you the way you already get paid. DigiMark101 does not collect their money inside Studio. If you want a DigiMark101 membership, the plans are on the pricing page and checkout uses PayPal. Reports count rows in your workspace. They are your counts, not a scoreboard of other people's sales.",
  },
] as const

export const howSteps = [
  {
    index: "01",
    title: "Claim your free beta seat",
    body: "Use the email you check. We send a sign-in link. No payment starts. Your account is ready for the full journey.",
  },
  {
    index: "02",
    title: "Walk through setup with Ava",
    body: "She asks one question at a time, fills the forms, and waits for your yes. Every answer is saved to your account so you never start over.",
  },
  {
    index: "03",
    title: "Build something real",
    body: "Add contacts, move a deal, draft a page or email, save a file, or set a reminder. Everything you create is stored under your login.",
  },
  {
    index: "04",
    title: "Keep everything you made",
    body: "The workspace, memory, drafts, and files stay with your account. Beta testers keep all the work they produce. Upgrade only if you want more later.",
  },
] as const

export const features = [
  {
    group: "Ava Skye",
    name: "Ava Skye",
    summary:
      "Ava is the AI assistant for DigiMark101. AI means she can talk with you, draft the work, and fill in setup forms. She guides a new account one question at a time.",
    today: "She saves a change only after you confirm it. She answers through OpenAI when that connection is on. If it is off, she says so and does not guess. She does not invent proof.",
  },
  {
    group: "Ava Skye",
    name: "Voice or typing",
    summary: "You can talk to Ava, or you can type. The same person answers either way. Her name is pronounced AY-vuh.",
    today: "Sound starts when you tap. The page does not play her voice on its own. If speech is not connected, the words stay on the screen.",
  },
  {
    group: "Ava Skye",
    name: "Six helpers",
    summary:
      "For a long draft, six helpers can work with Ava: pages and offers, social posts, ad notes, search outlines, follow-up, and research. A seventh job waits until one finishes.",
    today: "Ava still speaks to you in one voice. The helpers do not send, post, or spend. You confirm before anything is saved.",
  },
  {
    group: "People and sales",
    name: "Contacts",
    summary: "Your CRM: the people in this workspace, with name, email, company, and notes. CRM is the short name for that contact list.",
    today: "Each login sees its own people. Ava can draft a contact. You confirm before it is saved.",
  },
  {
    group: "People and sales",
    name: "Pipeline",
    summary: "Deals move through stages: new, qualified, proposal, won, and lost. This is how you see who might pay you, without a spreadsheet.",
    today: "A stage change is a record in your workspace. It is not a public result and not a promise that a deal will close.",
  },
  {
    group: "People and sales",
    name: "Calendar",
    summary: "Appointments you or Ava book in this workspace, so the next conversation has a time.",
    today: "Booking lives in Studio. It is not a public scheduling link for your customers yet.",
  },
  {
    group: "People and sales",
    name: "Inbox",
    summary: "A place for notes and for lines that automations write when they run.",
    today: "Outside email and text messages are not connected. The inbox is not your Gmail.",
  },
  {
    group: "Marketing",
    name: "Email",
    summary: "Email lists and campaign drafts, written in your workspace. Email marketing means writing to people who asked to hear from you.",
    today: "Creating a campaign does not send it. Sending waits until an email provider is connected.",
  },
  {
    group: "Marketing",
    name: "Funnels and websites",
    summary: "Records for a site or a funnel, plus Builds for websites, banners, and pages with their links.",
    today: "A record is a plan. The visual builder is a later phase, so nothing on that screen is published for you.",
  },
  {
    group: "Marketing",
    name: "Social",
    summary:
      "Ava drafts posts for Facebook, Instagram, LinkedIn, X, TikTok, YouTube, or Google Business Profile, and Studio saves them for you.",
    today: "Coming soon: connecting your accounts and posting straight to each network. For now, you copy the draft and post it yourself.",
  },
  {
    group: "Marketing",
    name: "Automations",
    summary:
      "An automation is a small rule that runs inside your workspace. Triggers: a contact is created, an appointment is booked, or a deal moves. Actions: log an inbox note, or save a memory.",
    today: "These rules do not send email or place a call. They keep the workspace in order.",
  },
  {
    group: "Marketing",
    name: "Media, files, and builds",
    summary: "A media library for images, video, and documents. Private files. Build records for pages and banners you want to reuse.",
    today: "Files sit in your own folder. Other clients cannot read them.",
  },
  {
    group: "The business",
    name: "Video maker",
    summary:
      "Ava can write a script, split it into scenes, and prepare a video of herself. A finished video is lip-synced at premium quality once the avatar and video keys are set.",
    today: "Without those keys you can still make a preview draft. The draft is labeled. It is not a finished ad.",
  },
  {
    group: "The business",
    name: "Apps catalog",
    summary: "A plain list of the jobs and outside tools, with a note on what works today and what is still coming.",
    today: "Open it from Studio. A tool marked coming soon is not connected, and Ava will not pretend a send or a post already happened.",
  },
  {
    group: "The business",
    name: "Studio",
    summary: "Studio is the workspace: today, people, marketing, reports, files, and settings in one login. You can open it in preview before you create an account.",
    today: "Preview shows the screens. Create an account when you want the work saved to your login.",
  },
  {
    group: "The business",
    name: "Leads engine",
    summary:
      "Leads can come from the contact form, from Ava when someone asks to be contacted, and from connected sources. A job scores them and can promote a lead that clears the bar and allowed sharing.",
    today: "Buyers see anonymized lists by niche. Personal details stay hidden. Opt out is available. Checkout for a list is not connected, so a request stays pending until it is marked paid.",
  },
  {
    group: "The business",
    name: "Business setup and memory",
    summary: "Business setup stores the company facts, links, and profile addresses. Memory stores facts Ava should reuse for this client.",
    today: "Memory is private to that login. Ava asks before she writes a fact down.",
  },
  {
    group: "The business",
    name: "Reports",
    summary: "Counts of your own rows: contacts, deals, appointments, campaigns, automations, and memories.",
    today: "These are not industry benchmarks and not client results.",
  },
  {
    group: "The business",
    name: "White-label backend",
    summary:
      "Coming soon. A managed backend is a separate database project for a workspace, under a name and region you choose. White-label means it carries your name, not ours.",
    today: "Not available yet. Today your records live in DigiMark101's database, private to your login, with the keys kept on the server.",
  },
  {
    group: "The business",
    name: "Beta",
    summary: "The beta is a free tester seat. You use the email you actually check, open Studio, and try one real thing.",
    today: "There is no PayPal step on the beta form. Feedback you send inside Studio is visible to the owner, not to other testers, and it is not published on this site.",
  },
] as const

export const disciplinePlain: Record<string, string> = {
  seo: "SEO means search: help people find you when they type a question. Fixes can show up in weeks. New pages take longer. A rank by a date is a guess, so we do not promise one.",
  "paid-ads": "Ads you pay a platform to show, usually on Google or a social network. Start with one offer and a budget you can explain.",
  social: "Posts where your people already spend time, with a path back to the offer. Two networks done properly beat six that go quiet.",
  content: "The words on your pages, emails, and posts. Say who it is for and what to do next. Clear beats clever.",
  "web-design": "A site or a single page that explains the offer and loads fast. Every page needs a job.",
  email: "Messages for people who asked to hear from you. In Studio you draft them. Sending waits until an email provider is connected.",
  analytics: "A short list of questions and the numbers that answer them. Studio reports count your own rows. They are not a borrowed success story.",
  "ai-automation": "Ava and small workspace rules that draft, sort, and remind. A person still confirms anything a customer will see.",
}

export const reasons = [
  {
    title: "Ava does the setup with you",
    body: "Most platforms hand you a menu. Ava asks one question at a time, fills the forms, and waits for yes. The time you save is the time you would have spent learning each screen and typing the same facts again. We do not invent an hour count, because that depends on you.",
  },
  {
    title: "The words stay plain",
    body: "A CRM is your contact list with a memory. A funnel is a page with one job, then a follow-up, then the offer. A pipeline is the path from “just met” to “said yes.” You can start before those words feel natural.",
  },
  {
    title: "The jobs share one login",
    body: "Contacts, pipeline, calendar, email drafts, page plans, social drafts, files, and automations live in Studio. You can begin without renting a separate product for every job.",
  },
  {
    title: "You keep your work",
    body: "Contacts, drafts, files, and memory stay on your account. A white-label backend under your own name is coming soon. Publishing, sending, and spending wait for your yes. That is what keeping your marketing workspace means here.",
  },
  {
    title: "The same door works for every stage",
    body: "Beginners, side hustlers, creators, local businesses, and agencies use the same platform. The eight disciplines are the map. Ava helps you pick the next step instead of turning everything on at once.",
  },
  {
    title: "The better choice is the one you can run",
    body: "People shopping for an all-in-one tool often look at GoHighLevel. That platform publishes a long agency menu: pages, calling, texting, payments, courses, and more. DigiMark101 is built for the same ambition, one workspace you can grow a business on, with Ava setting it up beside you. Where a feature is still being connected, this page says so. A longer catalog is a weaker choice if it leaves you stuck before you start.",
  },
] as const

export const comparison = [
  {
    job: "Someone to set it up",
    stack: "You read the help docs, or you hire a person to click through each tool.",
    here: "Ava asks, fills the form, and waits for your yes. You review the setup instead of rebuilding it by hand.",
  },
  {
    job: "Contact list (a CRM)",
    stack: "A separate contact tool with its own login.",
    here: "Contacts in Studio, private to your workspace.",
  },
  {
    job: "Sales stages (a pipeline)",
    stack: "Often another view inside the contact tool, or a spreadsheet.",
    here: "A pipeline from new to won, including qualified, proposal, and lost.",
  },
  {
    job: "Follow-up email",
    stack: "A separate email product.",
    here: "Email lists and campaign drafts in Studio. Sending starts after an email provider is connected.",
  },
  {
    job: "A sales page (a funnel)",
    stack: "A website builder or a funnel product.",
    here: "Funnel and site records, plus build links. The visual builder is a later phase, so a record is not a live site.",
  },
  {
    job: "Rules that run on their own",
    stack: "A connector product, or the automation menu inside each tool.",
    here: "Automations inside the workspace. They can log a note or save a memory when a contact, appointment, or deal changes.",
  },
  {
    job: "Social posts",
    stack: "A scheduler with another password.",
    here: "Ava drafts posts for Facebook, Instagram, LinkedIn, X, TikTok, YouTube, and Google Business Profile. Connecting accounts and posting for you is coming soon.",
  },
  {
    job: "Learning the marketing",
    stack: "Courses, videos, and an agency you talk to in a different place.",
    here: "Eight disciplines written in plain language, and Ava to choose a next step. You can also hire the studio. Those packages are quoted in a proposal.",
  },
  {
    job: "Leads you are allowed to contact",
    stack: "A lead vendor, with a separate contract.",
    here: "A leads engine that scores and sorts by niche. Public lists hide personal details. People can opt out. List checkout is not connected yet.",
  },
  {
    job: "Your own database",
    stack: "The vendor’s account. You rent the records.",
    here: "Coming soon: a white-label backend under your own name. Today your records stay private to your login, and the keys stay on the server.",
  },
  {
    job: "Phone and text",
    stack: "A dialer and a texting tool.",
    here: "Not connected. DigiMark101 will not claim a call or a text was sent.",
  },
] as const

export const homeFaqs = [
  {
    question: "What is DigiMark101, in plain words?",
    answer:
      "It is a marketing platform and a studio. The platform is called Studio. It holds your people, your sales stages, your drafts, your files, and your reminders. The studio is the eight kinds of marketing work. Ava Skye helps you set it up. You confirm before she saves.",
  },
  {
    question: "Who is it for?",
    answer:
      "The homepage is written for a small business or solo operator in the United States with one offer. Beginners, creators, and agencies can still start. Each path on the page goes to a page that already exists.",
  },
  {
    question: "Is the beta free?",
    answer:
      "Yes. A beta seat is free. Use the email you check. We send a sign-in link, and there is no PayPal step on that form. If an invite code is required, the form says so. Feedback you send later stays with the owner.",
  },
  {
    question: "What does Ava do?",
    answer:
      "She is the AI assistant. She asks one question at a time, fills the forms, and waits for your yes before she saves. She can talk or type. She does not invent clients, ranks, or revenue numbers.",
  },
  {
    question: "Do I own the platform?",
    answer:
      "You keep everything you build in your account: contacts, drafts, files, and memory. A white-label backend under your own name is coming soon. Today your records stay private to your login. DigiMark101 is the platform; your workspace is yours.",
  },
] as const
