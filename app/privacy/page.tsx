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
        lede="Last updated October 16, 2026. This is the studio's working privacy notice for www.digimark101.com. Have counsel review it if you need a formal legal opinion."
      />
      <div className="prose-studio mx-auto max-w-3xl px-5 py-14">
        <h2>Who we are</h2>
        <p>
          DigiMark101 operates this website. Questions about your information can be sent to {site.email}.
        </p>
        <h2>What we collect</h2>
        <p>
          The contact form asks for your name, email, an optional company and website, the kind of help you want, an optional budget range, and a message. If you fill the hidden company-website field, the note is discarded as automated traffic.
        </p>
        <p>
          The host, Vercel, may keep standard request logs such as IP address, browser, and the page requested. This site does not run third-party advertising pixels.
        </p>
        <h2>Ava Skye</h2>
        <p>
          Messages you send to Ava are processed to produce a reply. When an API key is configured, the conversation needed to answer you is sent to the configured model provider: xAI, OpenAI, or another OpenAI-compatible endpoint you set. When no key is configured, the reply is generated from the studio guide on this application and is not sent to a model provider.
        </p>
        <p>Ava conversations are not written to the leads database. Do not send passwords, payment cards, or other secrets in the chat.</p>
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
          When Supabase is configured with a server-side service role key, the contact note is stored in a private leads table. The anon key alone is not used to write leads. When Supabase is not configured, the note is not stored. The form says so and offers an email draft instead.
        </p>
        <h2>How long we keep it</h2>
        <p>
          Lead notes are kept so the studio can reply and, if you become a client, so the briefing is not lost. Email {site.email} to ask for a copy or deletion of a note you sent. We will delete inquiry notes that are not needed for an active conversation or a legal obligation.
        </p>
        <h2>Sharing</h2>
        <p>
          We do not sell personal information. Processors that may handle it, depending on what the owner has connected, are Vercel for hosting, Supabase for storage, PayPal for membership billing, and the configured language-model provider for Ava. Each receives only what it needs to do that job.
        </p>
        <h2>Children</h2>
        <p>This site is not directed at children under 16, and we do not knowingly collect their information.</p>
        <h2>Changes</h2>
        <p>If this notice changes in a material way, the date at the top of the page will change with it.</p>
      </div>
    </>
  )
}
