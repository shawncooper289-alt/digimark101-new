import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/site/header'

export const metadata: Metadata = {
  title: 'DigiMark101',
  description: 'Ava Skye marketing OS — strategy, creative studio and purposeful work.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Header />{children}<footer className="footer"><span>DigiMark101 · Ava Skye marketing OS</span><span>Early access · Checkout and live AI pending</span></footer></body>
    </html>
  )
}
