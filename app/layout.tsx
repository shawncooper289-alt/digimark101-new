import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DigiMark101',
  description: 'Ideas into impact. Explore creative digital strategy, branding, and intelligent experiences with DigiMark101.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
