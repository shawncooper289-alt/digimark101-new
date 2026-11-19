import { dialablePhone } from "@/lib/business-profile"
import { site } from "@/lib/site"
import { TrackedLink } from "@/components/site/tracked-link"

export function ContactPath({ event, id }: { event: string; id?: string }) {
  const phone = dialablePhone()
  return (
    <p id={id} className="flex flex-col items-start gap-1 text-sm leading-relaxed text-ink sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3">
      <TrackedLink href="/contact" event={event} className="inline-flex min-h-12 items-center font-semibold text-signal underline decoration-signal/40 underline-offset-4">
        Talk to a person
      </TrackedLink>
      <a className="inline-flex min-h-12 items-center underline decoration-ink/30 underline-offset-4" href={`mailto:${site.email}`}>
        {site.email}
      </a>
      {phone ? (
        <a className="inline-flex min-h-12 items-center underline decoration-ink/30 underline-offset-4" href={phone.href}>
          {phone.label}
        </a>
      ) : null}
    </p>
  )
}
