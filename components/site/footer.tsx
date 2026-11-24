import Link from "next/link"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import { ContactPath } from "@/components/site/contact-path"
import type { PartnerLink } from "@/lib/partners"
import { earningsDisclaimer } from "@/lib/home-content"
import { nav, services } from "@/lib/site"

export function Footer({ partners = [] }: { partners?: PartnerLink[] }) {
  return (
    <footer className="border-t border-ink/10 bg-paper-deep text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <DigiMarkLogo variant="paper" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
            An online digital marketing agency for small businesses in the United States, and the workspace those businesses keep. Ava Skye sets it up with you.
          </p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-soft">{earningsDisclaimer}</p>
          <div className="mt-4">
            <ContactPath event="footer_contact" />
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">Studio</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link prefetch={false} className="inline-flex min-h-11 items-center hover:text-signal" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/marketplace">
                Lead lists
              </Link>
            </li>
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/studio">
                Studio
              </Link>
            </li>
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/ava">
                Ava Skye
              </Link>
            </li>
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/contact">
                Contact
              </Link>
            </li>
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/agency/lead-generation">
                Lead generation
              </Link>
            </li>
            <li>
              <Link prefetch={false} className="hover:text-signal" href="/agency/ai">
                AI assistant
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">Disciplines</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link prefetch={false} className="inline-flex min-h-11 items-center hover:text-signal" href={`/services/${service.slug}`}>
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DigiMark101. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            {partners.map((partner) => (
              <a key={partner.label} href={partner.href} className="hover:text-signal" rel="noopener noreferrer">
                {partner.label}
              </a>
            ))}
            <Link prefetch={false} href="/privacy" className="inline-flex min-h-11 items-center hover:text-signal">
              Privacy
            </Link>
            <Link prefetch={false} href="/terms" className="inline-flex min-h-11 items-center hover:text-signal">
              Terms
            </Link>
            <Link prefetch={false} href="/sitemap.xml" className="inline-flex min-h-11 items-center hover:text-signal">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
