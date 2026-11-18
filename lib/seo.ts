import type { Metadata } from "next"
import { businessProfile, publicPostalAddress, publicSameAs } from "@/lib/business-profile"
import { services, site } from "@/lib/site"

type PageMetaInput = {
  title: string
  description: string
  path: string
  ogType?: "website" | "article"
  publishedTime?: string
  /** Skip the layout title template. Use for the homepage title. */
  absolute?: boolean
}

const organizationId = `${site.url}/#organization`
const websiteId = `${site.url}/#website`

export function pageMetadata({
  title,
  description,
  path,
  ogType = "website",
  publishedTime,
  absolute = false,
}: PageMetaInput): Metadata {
  const url = path === "/" ? `${site.url}/` : `${site.url}${path}`
  const imageAlt = `${site.name}: ${title}`
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path === "/" ? "/" : path },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: ogType,
      locale: "en_US",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: imageAlt }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/twitter-image", alt: imageAlt }],
    },
  }
}

const areaServed = { "@type": "Country", name: businessProfile.areaServed }

function contactPoint() {
  const point: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: site.email,
    url: `${site.url}/contact`,
    areaServed: "US",
    availableLanguage: ["English"],
  }
  const phone = businessProfile.phone.trim()
  if (phone) point.telephone = phone
  return point
}

export function organizationJsonLd() {
  const sameAs = publicSameAs()
  const address = publicPostalAddress()
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": organizationId,
    name: site.name,
    url: site.url,
    email: site.email,
    description: site.description,
    slogan: site.tagline,
    additionalType: "https://schema.org/ProfessionalService",
    logo: {
      "@type": "ImageObject",
      url: `${site.url}/icon`,
    },
    image: `${site.url}/opengraph-image`,
    areaServed,
    contactPoint: contactPoint(),
    knowsAbout: services.map((service) => service.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Digital marketing services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        url: `${site.url}/contact?interest=${service.slug}`,
        availability: "https://schema.org/InStock",
        description: "Quoted in a proposal. DigiMark101 does not publish a list price for agency work.",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          serviceType: service.name,
          description: service.summary,
          url: `${site.url}/services/${service.slug}`,
          areaServed,
          provider: { "@id": organizationId },
        },
      })),
    },
  }
  if (sameAs.length) organization.sameAs = sameAs
  if (address) organization.address = address

  // ProfessionalService / LocalBusiness rich results require a street address.
  // The node is added only after the owner fills businessProfile.address.
  // Until then the Organization carries additionalType ProfessionalService
  // and areaServed United States, with no invented location.
  const graph: Record<string, unknown>[] = [organization]
  if (address) {
    graph.push({
      "@type": "ProfessionalService",
      "@id": `${site.url}/#professional-service`,
      name: site.name,
      url: site.url,
      email: site.email,
      description: site.description,
      image: `${site.url}/opengraph-image`,
      areaServed,
      address,
      parentOrganization: { "@id": organizationId },
      ...(businessProfile.phone.trim() ? { telephone: businessProfile.phone.trim() } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    })
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@id": organizationId },
    inLanguage: "en-US",
  }
}

export function platformJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${site.url}/#software`,
    name: "DigiMark101 Studio",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: site.url,
    description: site.description,
    provider: { "@id": organizationId },
    featureList: [
      "Ava Skye setup assistant",
      "Contacts and pipeline",
      "Calendar and inbox notes",
      "Email drafts",
      "Funnel and site records",
      "Social drafts",
      "Workspace automations",
      "Leads engine",
      "Beta tester seats",
    ],
    offers: {
      "@type": "Offer",
      name: "Beta tester seat",
      price: "0",
      priceCurrency: "USD",
      url: `${site.url}/beta`,
      description:
        "A beta seat is free for testers. The beta form does not start a PayPal payment. Paid memberships are a separate offer on the pricing page.",
    },
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? `${site.url}/` : `${site.url}${item.path}`,
    })),
  }
}

export function faqJsonLd(faqs: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function articleJsonLd(input: {
  title: string
  description: string
  path: string
  date: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.date,
    dateModified: input.date,
    author: { "@id": organizationId },
    publisher: { "@id": organizationId },
    mainEntityOfPage: `${site.url}${input.path}`,
    image: `${site.url}/opengraph-image`,
  }
}
