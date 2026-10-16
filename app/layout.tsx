import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { AvaWidget } from "@/components/ava/ava-widget"
import { SiteChrome } from "@/components/site/chrome"
import { JsonLd } from "@/components/site/json-ld"
import { PlatformProvider } from "@/components/studio/platform-provider"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo"
import { site } from "@/lib/site"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
})

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "500", "600"],
})

export const viewport: Viewport = {
  themeColor: "#f6f1fb",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "DigiMark101 — Marketing, built as a system",
    template: "%s · DigiMark101",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  category: "marketing",
  keywords: [
    "DigiMark101",
    "digital marketing agency",
    "SEO agency",
    "paid media",
    "Ava Skye",
    "marketing analytics",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: "DigiMark101 — Marketing, built as a system",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiMark101 — Marketing, built as a system",
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <PlatformProvider>
          <SiteChrome>{children}</SiteChrome>
          <AvaWidget />
        </PlatformProvider>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  )
}
