import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { AvaWidget } from "@/components/ava/ava-widget"
import { SiteChrome } from "@/components/site/chrome"
import { JsonLd } from "@/components/site/json-ld"
import { PlatformProvider } from "@/components/studio/platform-provider"
import { partnerLinks } from "@/lib/partners"
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
  themeColor: "#0b0d0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "DigiMark101 \u2014 Marketing, built as a system",
    template: "%s \u00b7 DigiMark101",
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DigiMark101",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: "DigiMark101 \u2014 Marketing, built as a system",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "DigiMark101 \u2014 Marketing, built as a system",
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
}

const authCatcher = `(function(){var p=location.pathname;if(p==="/auth/callback"||p==="/reset-password")return;var q=location.search,h=location.hash,s=q+h;if(!/[?&#](code|token_hash|access_token|refresh_token|error_description|error_code)=/.test(s))return;location.replace("/auth/callback"+q+h);})();`

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: authCatcher }} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DigiMark101" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <PlatformProvider>
          <SiteChrome partners={await partnerLinks()}>{children}</SiteChrome>
          <AvaWidget />
        </PlatformProvider>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  )
}
