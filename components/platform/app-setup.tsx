 'use client'
import { useEffect, useState } from 'react'
import { browserDatabase } from '@/lib/platform/browser'
export function AppSetup({ id, fields }: { id: string; fields: string[] }) {
 const [config, setConfig] = useState<Record<string,string>>(Object.fromEntries(fields.map(field => [field, ''])))
 const [notice, setNotice] = useState('')
 const [busy, setBusy] = useState(false)
 useEffect(() => {
  const db = browserDatabase()
  if (!db) return
  const { data } = db.auth.onAuthStateChange(() => { setConfig({}); setNotice('') })
  return () => data.subscription.unsubscribe()
 }, [])
 async function run(save: boolean) {
  setBusy(true); setNotice('')
  try {
   const db = browserDatabase(); if (!db) throw new Error('Configure Supabase and sign in through the workspace first.')
   const { data } = await db.auth.getSession(); if (!data.session) throw new Error('Sign in through the workspace first.')
   const user = data.session.user.id
   const res = await fetch('/api/platform/app-config' + (save ? '' : '?app=' + encodeURIComponent(id)), { method: save ? 'POST' : 'GET', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: save ? JSON.stringify({ app: id, config }) : undefined })
   const result = await res.json()
   const latest = await db.auth.getSession(); if (latest.data.session?.user.id !== user) { setConfig(Object.fromEntries(fields.map(field => [field,'']))); throw new Error('Account changed. Draft discarded.') }
   if (!res.ok) throw new Error(result.error || 'Request failed.')
   if (!save && result.draft) setConfig(result.draft.config)
   setNotice(save ? result.message : result.draft ? 'Draft loaded.' : 'No saved draft yet.')
  } catch(error) { setNotice(error instanceof Error ? error.message : 'Request failed.') } finally { setBusy(false) }
 }
 return <section className="panel"><p>Not connected · design and save a private setup draft. Do not enter passwords, API keys or sensitive customer data.</p><form onSubmit={e => { e.preventDefault(); run(true) }}>{fields.map(field => <label key={field}>{field}<textarea maxLength={2000} value={config[field] || ''} onChange={e => setConfig(current => ({ ...current, [field]: e.target.value }))} /></label>)}<button disabled={busy}>Save setup draft</button><button type="button" disabled={busy} onClick={() => run(false)}>Load draft</button></form><p role="status">{notice}</p></section>
}
