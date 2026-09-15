import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DigiMark101 | Digital Marketing Agency',
  description: 'Growth systems, content, automation, and campaigns built to move your business forward.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
