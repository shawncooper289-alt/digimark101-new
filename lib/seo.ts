import type { Metadata } from "next"
import { site } from "@/lib/site"

type PageMetaInput = {
  title: string
  description: string
  path: string
  ogType?: "website" | "article"
  publishedTime?: string
}

export function pageMetadata({
  title,
  description,
  path,
  ogType = "website",
  publishedTime,
}: PageMetaInput): Metadata {
  const url = `${site.url}${path}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: ogType,
      locale: "en_US",
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.name,
    url: site.url,
    email: site.email,
    description: site.description,
    areaServed: "Worldwide",
    serviceType: [
      "SEO",
      "Paid advertising",
      "Social media marketing",
      "Content marketing",
      "Web design",
      "Email marketing",
      "Marketing analytics",
      "AI automation",
    ],
    slogan: site.tagline,
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
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
      item: `${site.url}${item.path}`,
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
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}${input.path}`,
  }
}
