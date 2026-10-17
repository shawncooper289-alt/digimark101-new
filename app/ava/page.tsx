import { OpenAvaButton } from "@/components/ava/open-ava-button"
import { AvaAvatar } from "@/components/branding/ava-avatar"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Ava Skye",
  description: "Ava Skye is DigiMark101's studio assistant for services, packages, and starting briefs.",
  path: "/ava",
})

const rules = [
  { title: "She explains the work", body: "Services, packages, and the order we usually turn channels on." },
  { title: "She will not invent proof", body: "No client names, testimonials, or performance numbers that the studio has not published." },
  { title: "She does not press the buttons", body: "Ava does not send email, charge a card, or change an ad account from the chat." },
  { title: "She has a fallback", body: "With an API key she uses a live model. Without one, she answers from the studio guide and the widget says which mode you are in." },
]

export default function AvaPage() {
  return (
    <>
      <PageHeader
        eyebrow="08 — Assistant"
        title="Ava Skye, on the record."
        lede="Ava is the studio assistant. The mark is an illustration, not a photograph of a person. Her job is to make the first conversation sharper."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="rounded-[2rem] border border-ink/10 bg-card p-8 text-ink">
            <AvaAvatar size="xl" showOnlineIndicator />
            <p className="mt-6 font-serif text-4xl">Ask her before you write the form.</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Voice input uses your browser&apos;s speech recognition where it exists. Replies can be read aloud. Typing works in every browser.
            </p>
            <OpenAvaButton className="btn btn-signal mt-6">Open Ava</OpenAvaButton>
          </div>
        </div>
        <div className="grid gap-4 md:col-span-7">
          {rules.map((rule) => (
            <article key={rule.title} className="rounded-3xl border border-ink/10 bg-card p-5">
              <h2 className="font-serif text-2xl">{rule.title}</h2>
              <p className="mt-2 text-ink-soft">{rule.body}</p>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
