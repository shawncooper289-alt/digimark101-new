import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DigiMark101 | Digital Marketing Agency + Ava Skye AI',
  description: 'Brand, web, campaigns, and AI strategy. Discover DigiMark101, a digital marketing agency with a private Ava Skye intelligence workspace.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
