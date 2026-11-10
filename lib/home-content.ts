/**
 * Homepage copy for the public marketing site.
 * Describe only what the product code can do. No client counts, awards,
 * testimonials, prices, or income promises belong in this file.
 */

export const hero = {
  eyebrow: "DigiMark101",
  lead: "Build your own dynasty.",
  accent: "Own the system. Grow it with Ava.",
  lede:
    "DigiMark101 is the all-in-one marketing platform for people who want to make money online. Ava Skye is the assistant who sets it up with you. She fills in the forms. You read them and say yes. The system stays yours.",
} as const

export const earningsDisclaimer =
  "Earnings disclaimer: DigiMark101 helps you do the marketing work. Income is not guaranteed. What you make depends on your offer, your effort, and the people you reach."

export const pageLinks = [
  { href: "#what", label: "What it is" },
  { href: "#who", label: "Who it's for" },
  { href: "#earn", label: "Make money" },
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#disciplines", label: "Eight jobs" },
  { href: "#why", label: "Why Ava" },
  { href: "#compare", label: "Compare" },
  { href: "#beta-home", label: "Beta" },
  { href: "#faq", label: "Questions" },
] as const

export const audiences = [
  {
    name: "Beginners",
    body: "You want to make money online and you are not sure which screen to open first. Create an account and talk to Ava. She starts with plain questions, and she explains a word when you need it.",
  },
  {
    name: "Side hustlers",
    body: "You have a job and a few hours. A useful system is small: one offer, one list of people, and one follow-up you can run after work.",
  },
  {
    name: "Creators",
    body: "You already make videos, posts, or a newsletter. Studio keeps the people, the media, the drafts, and the next page in the same login.",
  },
  {
    name: "Local businesses",
    body: "You want people nearby to find you and take the next step. Search, ads, social, a site, and email are all on the map. Calling and texting from inside the app are not connected yet.",
  },
  {
    name: "Agencies",
    body: "You run marketing for clients. Studio holds a pipeline, drafts, files, and a backend you can request under a name you choose. Public lead lists hide personal details until an order is paid.",
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
    title: "Open an account",
    body: "Create an account when you want the work saved. You can also open Studio in preview first. A beta seat is free for testers and uses an email sign-in link.",
  },
  {
    index: "02",
    title: "Let Ava set it up",
    body: "She asks one question at a time and fills the forms on the screen. You check the draft and say yes. That confirm step is the time saver: you review the setup instead of retyping the same facts on every screen.",
  },
  {
    index: "03",
    title: "Use one piece of Studio",
    body: "Add a contact, move a deal, draft a page or an email, save a file, or turn on an automation. One finished piece beats a tour of every menu.",
  },
  {
    index: "04",
    title: "Keep the system",
    body: "The workspace is yours. Memory stays with that login. You can also ask for a white-label backend, a separate database project for the workspace. It is created only after you confirm, and only when that service is turned on.",
  },
] as const

export const features = [
  {
    group: "Ava Skye",
    name: "Ava Skye",
    summary:
      "Ava is the AI assistant for DigiMark101. AI means she can talk with you, draft the work, and fill in setup forms. She guides a new account one question at a time.",
    today: "She saves a change only after you confirm it. With a live model key she answers from that model. Without one, she answers from the studio guide. She does not invent proof.",
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
      "Connect Facebook, Instagram, LinkedIn, X, TikTok, YouTube, or Google Business Profile. Ava can draft a post for a network you name.",
    today: "A network stays on “needs app credentials” until that app is configured. Tokens are encrypted on the server. A draft is published only after you confirm.",
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
      "A managed backend is a separate database project for a workspace. You choose a name and a region. White-label means that project is set up for the workspace, and the keys are not sent to the browser.",
    today: "Ava can prepare the request. It is created only after you confirm, and only when the server credentials for that service are set.",
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
    title: "You keep the system",
    body: "Memory stays on your workspace. A white-label backend can be requested in a name you choose. Publishing, sending, and spending wait for your yes. That is what owning the marketing system means here.",
  },
  {
    title: "The same door works for every stage",
    body: "Beginners, side hustlers, creators, local businesses, and agencies use the same platform. The eight disciplines are the map. Ava helps you pick the next step instead of turning everything on at once.",
  },
  {
    title: "The better choice is the one you can run",
    body: "People shopping for an all-in-one tool often look at GoHighLevel. That platform publishes a long agency menu: pages, calling, texting, payments, courses, and more. DigiMark101 is built for the same ambition, one system you can grow a business on, with Ava setting it up beside you. Where a feature is still being connected, this page says so. A longer catalog is a weaker choice if it leaves you stuck before you start.",
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
    here: "Drafts for Facebook, Instagram, LinkedIn, X, TikTok, YouTube, and Google Business Profile when that network’s app is configured. You confirm before a post is published.",
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
    here: "A white-label managed backend you confirm. It opens only when DigiMark101’s server credentials for that service are set. Keys stay on the server.",
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
      "Beginners, side hustlers, creators, local businesses, and agencies. If you want to make money online and you want one system instead of a pile of logins, you are in the right place. You do not need to know the jargon to start.",
  },
  {
    question: "Who is Ava Skye?",
    answer:
      "Ava is the assistant on this site and inside Studio. She can explain the work, ask setup questions one at a time, fill forms, and draft a contact, a page, an email, a social post, or an automation. She saves it only after you say yes. With a live model key she uses that model. Without one, she answers from a studio guide. She does not invent clients or results.",
  },
  {
    question: "How do I make money with it?",
    answer:
      "You use it to choose an offer, keep a list of interested people, give them one next step, and follow up. Your customers pay you through the way you already get paid. DigiMark101 does not pay you and does not guarantee income. What you make depends on your offer, your effort, and the people you reach.",
  },
  {
    question: "What do CRM, funnel, and pipeline mean?",
    answer:
      "A CRM is your contact list with a memory. A funnel is a page with one job, then a follow-up, then the offer. A pipeline is the path of a sale, from new to won. You can use Studio before those words feel comfortable. Ava can explain them again whenever you ask.",
  },
  {
    question: "What should I try first?",
    answer:
      "Create an account, or join the beta if you want a free tester seat. Then talk to Ava or open Studio and add one contact. There is also a first-campaign path: one page, one form, and three follow-up emails. Ava drafts them. You approve before anything is called live. The starter membership for that path is priced on the first-campaign page.",
  },
  {
    question: "What is still being connected?",
    answer:
      "Email sending waits on an email provider. Phone and text are not connected. The visual page builder is a later phase, so a funnel record is not a published site. The inbox is notes, not your outside mailbox. Lead-list checkout is not connected, so a request stays pending. Calendar booking is inside Studio, not a public link for your customers yet.",
  },
  {
    question: "Why is this a better choice than separate tools, or a platform like GoHighLevel?",
    answer:
      "Separate tools mean a login for contacts, another for email, another for pages, and another for reminders. DigiMark101 puts those jobs in Studio and adds Ava to fill the setup. GoHighLevel is a large all-in-one menu many agencies rent, including calling, texting, and payments. DigiMark101 is the all-in-one for people who want that kind of system and also want a guide, plain language, and a clear line between what is live and what is still being built. This page compares capabilities. It does not invent prices.",
  },
  {
    question: "Is the beta free?",
    answer:
      "Yes. A beta seat is free. Use the email you check. We send a sign-in link, and there is no PayPal step on that form. If an invite code is required, the form says so. Feedback you send later stays with the owner. It is not posted on the public site.",
  },
  {
    question: "Do you show client results or guarantee income?",
    answer:
      `${earningsDisclaimer} Work pages are labeled samples. A client story goes up only after a partner approves the facts. Nothing on this site is a promised sale, rank, or paycheck.`,
  },
] as const
