import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Privacy",
  description: "How DigiMark101 handles contact notes, Ava conversations, and site data.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        lede="Last updated October 17, 2026. This is the studio's working privacy notice for www.digimark101.com. Have counsel review it if you need a formal legal opinion."
      />
      <div className="prose-studio mx-auto max-w-3xl px-5 py-14">
        <h2>Who we are</h2>
        <p>
          DigiMark101 operates this website. Questions about your information can be sent to {site.email}.
        </p>
        <h2>What we collect</h2>
        <p>
          The contact form asks for your name, email, an optional company and website, the kind of help you want, an optional budget range, an optional region and company size, and a message. You must agree that DigiMark101 may store the note and contact you. A separate box, off by default, is the only way to allow that contact to be shared if it later qualifies as a premium lead. If you fill the hidden company-website field, the note is discarded as automated traffic.
        </p>
        <p>
          The host, Vercel, may keep standard request logs such as IP address, browser, and the page requested. This site does not run third-party advertising pixels.
        </p>
        <h2>Ava Skye</h2>
        <p>
          Messages you send to Ava are processed to produce a reply. When an API key is configured, the conversation needed to answer you is sent to the configured model provider: xAI, OpenAI, or another OpenAI-compatible endpoint you set. When no key is configured, the reply is generated from the studio guide on this application and is not sent to a model provider.
        </p>
        <p>
          An Ava conversation is saved as a lead only when your message includes an email and you clearly ask to be contacted, for example by saying we may email you. It is marked shareable only if you also say we may share your contact or include you in a lead list. A passing mention of an email is not stored. Do not send passwords, payment cards, or other secrets in the chat.
        </p>
        <h2>Client workspaces</h2>
        <p>
          When you create an account, your contacts, pipeline, calendar, inbox notes, campaigns, site records, automations, files, and Ava memory are stored under your user id. Row-level security in Supabase allows that login to read and write only its own rows. Ava cannot read memory or records that belong to another client.
        </p>
        <h2>Membership</h2>
        <p>
          If you subscribe, PayPal processes the payment. We do not store your card number. We store the PayPal subscription id, plan, status, payer email, and payment times in Supabase. When you are signed in at checkout, that row is linked to your user id. Row-level security lets that login read only its own subscription.
        </p>
        <h2>Where leads are stored</h2>
        <p>
          Leads are stored in Supabase. New notes land in a hidden staging table. A scheduled job scores them and separates them by niche. Only a lead that clears the score threshold, has consent to be contacted, and is not on the suppression list is copied into the premium lead store. Everything else stays in staging, or moves to a hidden rejected table when consent is missing, the address is suppressed, or you ask for deletion.
        </p>
        <p>
          Name, email, phone, company, and the message text live in a separate table. Row-level security is on, and the anon and signed-in roles are revoked from that table. Only the owner account, checked in the application, and Ava&apos;s server-side service role can read those raw values. Buyers and other visitors get an anonymized preview: niche, region, company size, and score. The public site does not put raw emails in the page bundle or in logs.
        </p>
        <p>When Supabase is not configured, the note is not stored. The form says so and offers an email draft instead.</p>
        <h2>Lead sharing</h2>
        <p>
          A lead is sellable only when you gave consent to be contacted and a separate consent to share. Premium lists can be packaged for sale or kept for DigiMark101&apos;s own use. Own-use leads are not shown to buyers. Full contact details are released only after an order is marked paid. We do not scrape personal data from websites, and we do not connect a source whose terms forbid that collection. Connectors, when configured, call an HTTPS API the studio is allowed to use and still require a consent flag on each row.
        </p>
        <p>
          If you are in the European Economic Area or the United Kingdom, the basis for storing a lead is your consent. You can withdraw it at any time. If you are a California resident, you can opt out of the sale or sharing of personal information. We honor that opt-out through the suppression list. Commercial email, if it is sent later, will include a working unsubscribe and will follow CAN-SPAM. DigiMark101 does not send commercial email until a valid physical postal address is configured for those messages. This notice does not invent one.
        </p>
        <h2>Opt-out, unsubscribe, and deletion</h2>
        <p>
          Use the <a href="/unsubscribe">unsubscribe page</a> or email {site.email}. Opting out adds a hash of the address to the suppression list and removes the lead from the premium store and from staging. Choosing deletion also deletes the stored contact details. Future imports of that address are dropped. We do not confirm whether an address was already on file beyond recording the request you just made.
        </p>
        <h2>How long we keep it</h2>
        <p>
          A premium lead is kept while it remains qualified and you have not opted out. Staging rows stay until they qualify, you opt out, or you ask for deletion. Rejected rows keep a hash and a reason, not the email itself. Email {site.email} to ask for a copy of a note you sent.
        </p>
        <h2>Processors</h2>
        <p>
          Processors that may handle personal information, depending on what the owner has connected, are Vercel for hosting, Supabase for storage, PayPal for membership billing, the configured language-model provider for Ava, and an optional enrichment API. Each receives only what it needs to do that job. Enrichment runs on the server and is skipped when it is not configured.
        </p>
        <h2>Children</h2>
        <p>This site is not directed at children under 16, and we do not knowingly collect their information.</p>
        <h2>Changes</h2>
        <p>If this notice changes in a material way, the date at the top of the page will change with it.</p>
      </div>
    </>
  )
}
