import type { Metadata } from 'next';
import './styles.css';

export const metadata: Metadata = { title: 'DigiMark101', description: 'AI-guided growth operations' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
