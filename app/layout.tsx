import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"
import { JsonLd } from "@/components/site/json-ld"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo"
import { site } from "@/lib/site"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: ["500", "600"],
  adjustFontFallback: true,
})

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "600"],
  adjustFontFallback: true,
})

export const viewport: Viewport = {
  themeColor: "#0b0d0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const pageTitle = "Digital marketing agency for small businesses | DigiMark101"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: pageTitle,
    template: "%s | DigiMark101",
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  category: "marketing",
  keywords: [
    "DigiMark101",
    "all-in-one marketing platform",
    "Ava Skye",
    "marketing for beginners",
    "CRM",
    "email marketing",
    "digital marketing agency",
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
    title: pageTitle,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
}

const authCatcher = `(function(){var p=location.pathname;if(p==="/auth/callback"||p==="/reset-password")return;var q=location.search,h=location.hash,s=q+h;if(!/[?&#](code|token_hash|access_token|refresh_token|error_description|error_code)=/.test(s))return;location.replace("/auth/callback"+q+h);})();`

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: authCatcher }} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </body>
    </html>
  )
}
