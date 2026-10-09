import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apps } from '@/lib/ava/apps'
import { AppSetup } from '@/components/platform/app-setup'
export default async function Page({ params }: { params: Promise<{ app: string }> }) {
 const { app: id } = await params
 const app = apps.find(item => item.id === id)
 if (!app) notFound()
 return <main className="workspace"><Link href="/apps">← All apps</Link><h1>{app.name}</h1><p>{app.description}</p><AppSetup id={app.id} fields={[...app.fields]} /></main>
}
