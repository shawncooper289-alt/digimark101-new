import Link from 'next/link'
import { apps } from '@/lib/ava/apps'
export default function Page() { return <main className="workspace"><Link href="/workspace">← Onboarding & workspace</Link><h1>Client app hub</h1><p>Setup drafts only. Provider connections and execution are not activated. Ava can help you plan; no phone account, deployed bot or campaign is created here.</p><div className="grid gap-4 md:grid-cols-2">{apps.map(app => <Link className="panel" key={app.id} href={`/apps/${app.id}`}><h2>{app.name}</h2><p>{app.description}</p><strong>Configure draft →</strong></Link>)}</div></main> }
