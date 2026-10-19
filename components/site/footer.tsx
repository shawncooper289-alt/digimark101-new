import Link from "next/link"
import { DigiMarkLogo } from "@/components/branding/digimark-logo"
import type { PartnerLink } from "@/lib/partners"
import { nav, services, site } from "@/lib/site"

export function Footer({ partners = [] }: { partners?: PartnerLink[] }) {
  return (
    <footer className="border-t border-ink/10 bg-paper-deep text-ink">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <DigiMarkLogo variant="paper" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
            A digital marketing studio. Eight disciplines, one operating rhythm, and Ava Skye when you want a straight answer.
          </p>
          <a className="mt-4 inline-block text-sm underline decoration-ink/30 underline-offset-4" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">Studio</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-signal" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link className="hover:text-signal" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs uppercase tracking-[0.18em] text-signal">Disciplines</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {services.map((service) => (
              <li key={service.slug}>
                <Link className="hover:text-signal" href={`/services/${service.slug}`}>
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
            <Link href="/privacy" className="hover:text-signal">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-signal">
              Terms
            </Link>
            <a href="https://www.avaskye.online" className="hover:text-signal">
              Owner
            </a>
            <Link href="/sitemap.xml" className="hover:text-signal">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
