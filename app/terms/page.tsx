import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { site } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Terms",
  description: "Terms for using the DigiMark101 website and Ava Skye.",
  path: "/terms",
})

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms"
        lede="Last updated October 16, 2026. These terms cover the public website and DigiMark101 Membership. Project work is governed by a written proposal. Have counsel review them before you rely on them."
      />
      <div className="prose-studio mx-auto max-w-3xl px-5 py-14">
        <h2>Using the site</h2>
        <p>
          You may browse DigiMark101, read the journal, and send a project note. Do not misuse the forms, attempt to break the service, or send unlawful content. We may ignore or discard notes that look automated or abusive.
        </p>
        <h2>No project until a proposal</h2>
        <p>
          Field, Studio, and Partner describe the shape of the work. They are not an offer you can accept by using the form. A project starts when both sides agree to a written proposal that states scope, fee, and term.
        </p>
        <h2>Membership</h2>
        <p>
          DigiMark101 Membership is a separate auto-renewing subscription billed by PayPal in USD. The price and term on the pricing page are the offer. PayPal terms apply to the payment. You can cancel the renewal in PayPal. Cancelling stops the next charge. A membership does not start a Field, Studio, or Partner project.
        </p>
        <h2>Ava Skye</h2>
        <p>
          Ava is an assistant. Her answers can be incomplete or wrong, including when a live model is connected. They are not legal, financial, or advertising guarantees, and they are not a statement of client results. Do not rely on a chat reply as the scope of work.
        </p>
        <h2>Placeholders</h2>
        <p>
          Work pages marked as placeholders are structural examples. They are not testimonials and not measured outcomes. Do not reuse them as proof of performance.
        </p>
        <h2>Intellectual property</h2>
        <p>
          The site design, writing, and Ava illustration belong to DigiMark101 unless a page says otherwise. You may not copy the site or the assistant persona for another business. You keep what you submit in a project note, and you give the studio permission to use it to reply and to prepare a proposal.
        </p>
        <h2>Liability</h2>
        <p>
          The site is provided as available. To the extent the law allows, DigiMark101 is not liable for decisions you make from public pages or from Ava, or for losses from a service interruption. Paid work carries the liability terms in its proposal.
        </p>
        <h2>Contact</h2>
        <p>Questions about these terms: {site.email}.</p>
      </div>
    </>
  )
}
