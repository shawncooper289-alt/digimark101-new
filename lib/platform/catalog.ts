import type { AutomationAction, Trigger } from "@/lib/platform/types"

/** What a client can do with an app today. */
export type AppStatus = "works" | "connect" | "request" | "soon"

export type CatalogApp = {
  id: string
  group: string
  name: string
  plain: string
  today: string
  status: AppStatus
  href?: string
}

export type CatalogRecipe = {
  id: string
  name: string
  plain: string
  status: "works" | "soon"
  trigger?: Trigger
  action?: AutomationAction
}

export const CATALOG_APPS: CatalogApp[] = [
  {
    id: "contacts",
    group: "Email and customer list",
    name: "Customer list",
    plain: "Names and notes for the people you work with, kept in this workspace.",
    today: "You can add someone now. This is not Mailchimp or HubSpot.",
    status: "works",
    href: "/studio/contacts",
  },
  {
    id: "email-drafts",
    group: "Email and customer list",
    name: "Email drafts",
    plain: "Write an email here and keep it until you are ready.",
    today: "Creating one does not send it. Sending waits until a mail tool is connected.",
    status: "works",
    href: "/studio/campaigns",
  },
  {
    id: "inbox-notes",
    group: "Email and customer list",
    name: "Inbox notes",
    plain: "A place for notes, including notes that automatic rules write.",
    today: "This is not your Gmail or Outlook inbox.",
    status: "works",
    href: "/studio/inbox",
  },
  {
    id: "mailchimp",
    group: "Email and customer list",
    name: "Mailchimp",
    plain: "Send newsletters from Mailchimp.",
    today: "Not connected. Ava can draft the email. She cannot send it through Mailchimp.",
    status: "soon",
  },
  {
    id: "klaviyo",
    group: "Email and customer list",
    name: "Klaviyo",
    plain: "Store emails and flows for an online shop.",
    today: "Not connected. Nothing is sent to Klaviyo.",
    status: "soon",
  },
  {
    id: "hubspot",
    group: "Email and customer list",
    name: "HubSpot",
    plain: "A bigger customer system for deals and mail.",
    today: "Not connected. Your customer list in Studio stays here.",
    status: "soon",
  },
  {
    id: "activecampaign",
    group: "Email and customer list",
    name: "ActiveCampaign",
    plain: "Email sequences from ActiveCampaign.",
    today: "Not connected. A sequence is not sent.",
    status: "soon",
  },
  {
    id: "gmail",
    group: "Email and customer list",
    name: "Gmail",
    plain: "Read and send from a Gmail mailbox.",
    today: "Not connected. Studio notes are not your Gmail.",
    status: "soon",
  },
  {
    id: "outlook",
    group: "Email and customer list",
    name: "Outlook",
    plain: "Read and send from Outlook.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "facebook",
    group: "Social",
    name: "Facebook",
    plain: "Connect a Facebook page so drafts know which account they are for.",
    today: "Open Socials to connect. If the button says it needs app credentials, the connection is not live yet. Drafts are not posted for you.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "instagram",
    group: "Social",
    name: "Instagram",
    plain: "Connect Instagram for drafts.",
    today: "Open Socials to connect. Posting for you is not turned on.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "linkedin",
    group: "Social",
    name: "LinkedIn",
    plain: "Connect LinkedIn for drafts.",
    today: "Open Socials to connect. Posting for you is not turned on.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "x",
    group: "Social",
    name: "X",
    plain: "Connect X for drafts.",
    today: "Open Socials to connect. Posting for you is not turned on.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "tiktok",
    group: "Social",
    name: "TikTok",
    plain: "Connect TikTok for drafts.",
    today: "Open Socials to connect. Posting for you is not turned on.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "youtube",
    group: "Social",
    name: "YouTube",
    plain: "Connect a YouTube channel for drafts.",
    today: "Open Socials to connect. Uploading a video for you is not turned on.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "google-business",
    group: "Social",
    name: "Google Business Profile",
    plain: "Connect the Google listing for your shop or office.",
    today: "Open Socials to connect. Reviews are not pulled in, and posts are not published for you.",
    status: "connect",
    href: "/studio/social",
  },
  {
    id: "pinterest",
    group: "Social",
    name: "Pinterest",
    plain: "Pin drafts to Pinterest.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "threads",
    group: "Social",
    name: "Threads",
    plain: "Post to Threads.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "meta-ads",
    group: "Ads",
    name: "Meta ads",
    plain: "Facebook and Instagram ads.",
    today: "Ava can draft an ad note. She cannot open an ad account or spend money.",
    status: "soon",
  },
  {
    id: "google-ads",
    group: "Ads",
    name: "Google ads",
    plain: "Search and display ads.",
    today: "Ava can draft an ad note. She cannot spend money.",
    status: "soon",
  },
  {
    id: "tiktok-ads",
    group: "Ads",
    name: "TikTok ads",
    plain: "Paid TikTok campaigns.",
    today: "Not connected. No spend.",
    status: "soon",
  },
  {
    id: "linkedin-ads",
    group: "Ads",
    name: "LinkedIn ads",
    plain: "Paid LinkedIn campaigns.",
    today: "Not connected. No spend.",
    status: "soon",
  },
  {
    id: "paypal",
    group: "Payments",
    name: "PayPal membership",
    plain: "The public membership on the pricing page, billed by PayPal.",
    today: "Open Pricing. If the pay button says coming soon, PayPal is not set up yet. Ava will not ask for a card number.",
    status: "soon",
    href: "/pricing",
  },
  {
    id: "stripe",
    group: "Payments",
    name: "Stripe",
    plain: "Card checkout with Stripe.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "calendar",
    group: "Scheduling",
    name: "Studio calendar",
    plain: "Appointments you or Ava book inside this workspace.",
    today: "Booking one here does not text the person and does not sync to Google Calendar.",
    status: "works",
    href: "/studio/calendar",
  },
  {
    id: "calendly",
    group: "Scheduling",
    name: "Calendly",
    plain: "Let people book a time on Calendly.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "google-calendar",
    group: "Scheduling",
    name: "Google Calendar",
    plain: "Show Studio appointments on a Google calendar.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "zoom",
    group: "Scheduling",
    name: "Zoom",
    plain: "Add a Zoom link when you book a time.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "reports",
    group: "Analytics",
    name: "Studio counts",
    plain: "Counts of your own rows: people, deals, drafts.",
    today: "These are your workspace counts. They are not Google Analytics and not ad results.",
    status: "works",
    href: "/studio/reports",
  },
  {
    id: "google-analytics",
    group: "Analytics",
    name: "Google Analytics",
    plain: "Site traffic from Google Analytics.",
    today: "Not connected. Ava will not invent traffic numbers.",
    status: "soon",
  },
  {
    id: "search-console",
    group: "Analytics",
    name: "Search Console",
    plain: "Google search queries for your site.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "meta-pixel",
    group: "Analytics",
    name: "Meta pixel",
    plain: "A tracking pixel for Facebook ads.",
    today: "Not connected. No pixel is installed from here.",
    status: "soon",
  },
  {
    id: "funnels",
    group: "Online store",
    name: "Page and funnel records",
    plain: "A written plan for a page or a path to a sale.",
    today: "A record is a plan. It is not a published website.",
    status: "works",
    href: "/studio/sites",
  },
  {
    id: "shopify",
    group: "Online store",
    name: "Shopify",
    plain: "Products, orders, and abandoned carts from Shopify.",
    today: "Not connected. An abandoned-cart email does not send.",
    status: "soon",
  },
  {
    id: "woocommerce",
    group: "Online store",
    name: "WooCommerce",
    plain: "Products and carts from a WooCommerce shop.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "sms",
    group: "Text and phone",
    name: "Text messages",
    plain: "Send a text when someone books or goes quiet.",
    today: "Not connected. Studio cannot text anyone.",
    status: "soon",
  },
  {
    id: "phone",
    group: "Text and phone",
    name: "Phone calls",
    plain: "Call a lead from the workspace.",
    today: "Not connected. Ava will not place a call.",
    status: "soon",
  },
  {
    id: "video-drafts",
    group: "Video",
    name: "Video script drafts",
    plain: "Ask Ava for a hook, a script, and on-screen words.",
    today: "You get a draft. Nothing is uploaded.",
    status: "works",
    href: "/studio",
  },
  {
    id: "video-publish",
    group: "Video",
    name: "Video publishing",
    plain: "Upload a finished video to YouTube or social.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "google-reviews",
    group: "Reviews",
    name: "Google review requests",
    plain: "Ask a happy customer for a Google review.",
    today: "Not connected. Ava can draft the words. She does not send the request.",
    status: "soon",
  },
  {
    id: "yelp",
    group: "Reviews",
    name: "Yelp",
    plain: "Pull or request Yelp reviews.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "zapier",
    group: "Connections",
    name: "Zapier",
    plain: "Let another tool start a step when something happens here.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "make",
    group: "Connections",
    name: "Make",
    plain: "Same idea as Zapier, using Make.",
    today: "Not connected.",
    status: "soon",
  },
  {
    id: "webhooks",
    group: "Connections",
    name: "Webhooks",
    plain: "Send a private note to a web address you control when something changes.",
    today: "Not connected. No outside address is called.",
    status: "soon",
  },
  {
    id: "backend",
    group: "Connections",
    name: "Separate backend",
    plain: "Ask for a private database under a name you choose.",
    today: "You can request it. No project is created until the management keys are set.",
    status: "request",
    href: "/studio/backend",
  },
]

export const CATALOG_RECIPES: CatalogRecipe[] = [
  {
    id: "welcome-note",
    name: "Note when someone is added",
    plain: "When you add a person, Studio writes a note in the inbox. It does not email them.",
    status: "works",
    trigger: "contact.created",
    action: "log_inbox",
  },
  {
    id: "remember-contact",
    name: "Remember a new person",
    plain: "When you add a person, Studio saves a short memory for Ava.",
    status: "works",
    trigger: "contact.created",
    action: "remember",
  },
  {
    id: "appointment-note",
    name: "Note when a time is booked",
    plain: "When an appointment is booked here, Studio writes an inbox note. It does not send a reminder text.",
    status: "works",
    trigger: "appointment.booked",
    action: "log_inbox",
  },
  {
    id: "remember-appointment",
    name: "Remember a booked time",
    plain: "When an appointment is booked here, Studio saves a memory.",
    status: "works",
    trigger: "appointment.booked",
    action: "remember",
  },
  {
    id: "deal-note",
    name: "Note when a deal moves",
    plain: "When a deal changes stage, Studio writes an inbox note.",
    status: "works",
    trigger: "deal.moved",
    action: "log_inbox",
  },
  {
    id: "remember-deal",
    name: "Remember a moved deal",
    plain: "When a deal changes stage, Studio saves a memory.",
    status: "works",
    trigger: "deal.moved",
    action: "remember",
  },
  {
    id: "lead-follow-up",
    name: "Lead follow-up emails",
    plain: "Email someone who asked about the offer and has not replied.",
    status: "soon",
  },
  {
    id: "welcome-sequence",
    name: "Welcome email sequence",
    plain: "A short series of emails after someone joins the list.",
    status: "soon",
  },
  {
    id: "abandoned-cart",
    name: "Abandoned cart",
    plain: "Email a shopper who left items in the cart.",
    status: "soon",
  },
  {
    id: "review-request",
    name: "Review request",
    plain: "Ask a customer for a review after the work is done.",
    status: "soon",
  },
  {
    id: "social-schedule",
    name: "Social posting schedule",
    plain: "Publish a planned post on a date without you copying it over.",
    status: "soon",
  },
  {
    id: "appointment-reminder",
    name: "Appointment reminder text",
    plain: "Text a reminder before a booked time.",
    status: "soon",
  },
  {
    id: "report-digest",
    name: "Weekly report email",
    plain: "Email a Monday summary of what changed.",
    status: "soon",
  },
]

export function statusLabel(status: AppStatus) {
  if (status === "works") return "Works now"
  if (status === "connect") return "Connect"
  if (status === "request") return "Request access"
  return "Coming soon"
}

export function catalogGroups(apps: CatalogApp[]) {
  const groups: { name: string; apps: CatalogApp[] }[] = []
  for (const app of apps) {
    const current = groups.find((group) => group.name === app.group)
    if (current) current.apps.push(app)
    else groups.push({ name: app.group, apps: [app] })
  }
  return groups
}

export function recipeById(id: string) {
  return CATALOG_RECIPES.find((recipe) => recipe.id === id) ?? null
}

export function withPaypalReady(apps: CatalogApp[], ready: boolean): CatalogApp[] {
  return apps.map((app) => {
    if (app.id !== "paypal") return app
    if (!ready) return app
    return {
      ...app,
      status: "works",
      today: "Membership checkout is on the pricing page. PayPal bills it until you cancel. Ava will not ask for a card number.",
    }
  })
}
