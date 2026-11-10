import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display-loaded" });
const sans = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans-loaded" });

export const metadata: Metadata = {
  title: "Ava's Skye Studio",
  description: "Ava's Skye Studio. The private desk stays Ava's, on every account.",
  metadataBase: new URL("https://www.avaskye.online"),
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ava Studio",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d0e",
};

const authCatcher = `(function(){var p=location.pathname;if(p==="/auth/callback"||p==="/reset-password")return;var q=location.search,h=location.hash,s=q+h;if(!/[?&#](code|token_hash|access_token|refresh_token|error_description|error_code)=/.test(s))return;location.replace("/auth/callback"+q+h);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: authCatcher }} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ava Studio" />
        <link rel="apple-touch-icon" href="/ava/professional.jpg" />
      </head>
      <body className="min-h-full" style={{ fontFamily: "var(--font-sans-loaded), var(--font-sans)" }}>
        {children}
      </body>
    </html>
  );
}
