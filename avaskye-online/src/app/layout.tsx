import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display-loaded" });
const sans = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans-loaded" });

export const metadata: Metadata = {
  title: "Owner office",
  description: "Private back office for DigiMark101.",
  metadataBase: new URL("https://avaskye.online"),
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-full" style={{ fontFamily: "var(--font-sans-loaded), var(--font-sans)" }}>
        {children}
      </body>
    </html>
  );
}
