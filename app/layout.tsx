import type { Metadata } from 'next'
import './globals.css'
import { AvaCompanion } from '@/components/platform/ava-companion'

export const metadata: Metadata = {
  title: 'DigiMark101',
  description: 'DigiMark101 voice assistant web app scaffold',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}<AvaCompanion /></body>
    </html>
  )
}
