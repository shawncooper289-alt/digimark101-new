import { agencyPages } from "@/lib/agency-pages"
import { services, site } from "@/lib/site"

const lines = (items: string[]) => items.filter(Boolean).join("\n")

export function llmsText() {
  return lines([
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    "DigiMark101 is an online digital marketing agency and a marketing workspace for small businesses in the United States. Clients are remote. No street address is published.",
    "",
    "Ava Skye (pronounced AY-vuh) is the AI setup guide. She asks one question at a time, fills the forms, and saves only after the person says yes. She does not send email, post to social networks, or spend ad money on her own.",
    "",
    "A beta seat is free for testers. The form sends an email sign-in link and does not start a PayPal payment.",
    "",
    "## Start here",
    "",
    `- [Home](${site.url}/)`,
    `- [Agency](${site.url}/agency)`,
    `- [Digital marketing for small businesses](${site.url}/agency/small-business)`,
    `- [Lead generation](${site.url}/agency/lead-generation)`,
    `- [AI marketing assistant](${site.url}/agency/ai)`,
    `- [Services](${site.url}/services)`,
    `- [Free beta seat](${site.url}/beta)`,
    `- [Contact a person](${site.url}/contact): ${site.email}`,
    `- [Pricing](${site.url}/pricing)`,
    `- [Ava Skye](${site.url}/ava)`,
    "",
    "## Services",
    "",
    ...services.map((service) => `- [${service.name}](${site.url}/services/${service.slug}): ${service.summary}`),
    "",
    "## Limits",
    "",
    "- No published client testimonials, logos, revenue, or lead counts.",
    "- Email sending, texting, social posting, and the visual page builder are not fully connected. Phone calls are owner-only, require agreement, and only dial numbers on an approved list. The site says so on the relevant page.",
    "- Agency fees are quoted in a proposal. Do not invent a price.",
    "",
    `Full notes: ${site.url}/llms-full.txt`,
    "",
  ])
}

export function llmsFullText() {
  const agency = agencyPages
    .map((page) =>
      lines([
        `## ${page.heading}`,
        "",
        page.lede,
        "",
        ...page.sections.flatMap((section) => [`### ${section.heading}`, "", ...section.paragraphs, ""]),
        ...page.faqs.flatMap((faq) => [`Q: ${faq.question}`, `A: ${faq.answer}`, ""]),
      ]),
    )
    .join("\n")

  return lines([
    llmsText(),
    "## Who it is for",
    "",
    "Primary: small businesses and solo operators in the United States who already have one offer and want the marketing in one workspace.",
    "Also served, with their own pages: beginners using the first-campaign template, creators who need drafts and files, and agencies that need a pipeline. A white-label backend under the agency's own name is coming soon.",
    "",
    "## Workspace today",
    "",
    "Contacts, pipeline (new, qualified, proposal, won, lost), calendar, inbox notes, email drafts, funnel and site records, social drafts, files, media, automations, and a leads engine.",
    "Automations can log a note or save a memory. They do not send email or place a call.",
    "Public lead lists show niche, region, company size, and score. Names, emails, and phone numbers stay hidden until an order is paid. List checkout is not connected. Opt out is available.",
    "Studio can be opened in preview before an account is created. Preview does not publish a site.",
    "",
    agency,
    "## Contact",
    "",
    `Email: ${site.email}`,
    `Contact form: ${site.url}/contact`,
    "Phone: not published. Do not invent one.",
    "",
  ])
}
