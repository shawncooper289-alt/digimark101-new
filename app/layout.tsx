import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ava Skye | DigiMark101',
  description: 'Meet Ava Skye, your AI growth partner. Strategy, private brand knowledge, and social intelligence in one connected workspace.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
