import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DigiMark101 | Ava Skye',
  description: 'Meet Ava Skye, the voice assistant from DigiMark101.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
