 'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { browserDatabase } from '@/lib/platform/browser'
export function AvaCompanion() {
 const path = usePathname()
 const [open, setOpen] = useState(false)
 const [guided, setGuided] = useState(true)
 const [voice, setVoice] = useState(false)
 const [message, setMessage] = useState('')
 const [answer, setAnswer] = useState('')
 const [busy, setBusy] = useState(false)
 useEffect(() => {
  const db = browserDatabase()
  if (!db) return
  const { data } = db.auth.onAuthStateChange(() => { setMessage(''); setAnswer(''); window.speechSynthesis?.cancel() })
  return () => { data.subscription.unsubscribe(); window.speechSynthesis?.cancel() }
 }, [])
 if (!path.startsWith('/apps') && path !== '/workspace') return null
 async function ask() {
  setBusy(true); setAnswer('')
  try {
   const db = browserDatabase(); if (!db) throw new Error('Supabase setup is required. Sign in in the workspace.')
   const { data } = await db.auth.getSession(); if (!data.session) throw new Error('Sign in in the workspace to ask Ava.')
   const user = data.session.user.id
   const res = await fetch('/api/platform/chat', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Current client app page: ${path}. Guidance requested: ${message}` }) })
   const result = await res.json()
   const latest = await db.auth.getSession(); if (latest.data.session?.user.id !== user) throw new Error('Account changed; response discarded.')
   if (!res.ok) throw new Error(result.error || 'Ava could not respond.')
   setAnswer(result.text)
   if (voice && window.speechSynthesis) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(result.text)) }
  } catch(error) { setAnswer(error instanceof Error ? error.message : 'Request failed.') } finally { setBusy(false) }
 }
 return <aside className="ava-floating" aria-label="Ava assistant"><button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Minimize Ava' : 'Ask Ava'}</button>{open && <div><h2>Ava Skye</h2><label><input type="checkbox" checked={guided} onChange={e => setGuided(e.target.checked)} /> Show beginner guidance</label><label><input type="checkbox" checked={voice} onChange={e => { setVoice(e.target.checked); if (!e.target.checked) window.speechSynthesis?.cancel() }} /> Read replies aloud (browser voice)</label>{guided && <p>Start with your onboarding brief. Design this app’s setup, confirm prerequisites, then connect its provider. These apps currently save drafts only; Ava cannot provision numbers, call, send or launch campaigns.</p>}<form onSubmit={e => { e.preventDefault(); ask() }}><label>Ask about this page<textarea maxLength={3000} required value={message} onChange={e => setMessage(e.target.value)} /></label><button disabled={busy}>{busy ? 'Working…' : 'Ask Ava'}</button></form><div className="answer" aria-live="polite">{answer}</div><p>Advisory only. Voice is browser readout, not calling or an approved Ava voice.</p><Link href="/workspace">Sign in / onboarding</Link></div>}</aside>
}
