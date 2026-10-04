'use client'
import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function Workspace() {
  const [db] = useState<SupabaseClient | null>(() => {
    const url = (process.env.NEXT_PUBLIC_digimark101_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = (process.env.NEXT_PUBLIC_digimark101_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_digimark101_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (!url || !key) return null
    try { return createClient(url, key) } catch { return null }
  })
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('Ava chat')
  const [reply, setReply] = useState('')
  useEffect(() => {
    if (!db) return
    db.auth.getSession().then(({ data }) => setToken(data.session?.access_token || ''))
    const { data } = db.auth.onAuthStateChange((_, session) => setToken(session?.access_token || ''))
    return () => data.subscription.unsubscribe()
  }, [db])
  async function run(action: () => Promise<void>) {
    setBusy(true); setNotice('')
    try { await action() } catch (e) { setNotice(e instanceof Error ? e.message : 'Request failed.') }
    finally { setBusy(false) }
  }
  async function api(path: string, body?: object) {
    const res = await fetch(path, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed.')
    return data
  }
  return <section id="workspace" className="section workspace">
    <div className="eyebrow">YOUR GROWTH COMMAND CENTER</div><h2>Meet your next move.</h2><p className="muted">Ava brings strategy, your private knowledge, and social research into one workspace.</p>
    <div className="panel">
      <div className="tabs">{['Ava chat', 'Knowledge base', 'X research', 'Project handoff'].map(t => <button key={t} className={tab === t ? 'selected' : ''} onClick={() => { setTab(t); setReply('') }}>{t}</button>)}<span className="session-label">{token ? 'Private workspace' : 'Sign in required'}</span></div>
      {!db ? <div className="setup">Add your public Supabase URL and anon key in Vercel Settings, then redeploy to enable sign-in.</div> : !token ? <form className="auth" onSubmit={e => { e.preventDefault(); run(async () => {
        const result = otp ? await db.auth.verifyOtp({ email, token: otp, type: 'email' }) : await db.auth.signInWithOtp({ email })
        if (result.error) throw result.error
        setNotice(otp ? 'Signed in.' : 'Check your email. Use the sign-in link, or enter the email code if your template includes one.')
      }) }}><label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label><label>Email code (optional)<input value={otp} onChange={e => setOtp(e.target.value)} autoComplete="one-time-code" /></label><button className="primary" disabled={busy}>{otp ? 'Verify code' : 'Send sign-in email'}</button></form> : <>
      {tab === 'Ava chat' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/chat', { message }); setReply(data.text); setNotice(`${data.retrieval}. Sources: ${data.sources.join(', ') || 'Ava core knowledge'}.${data.saved ? '' : ' Conversation could not be saved.'}`) }) }}><label>Your growth challenge<textarea required maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Help me plan a launch for my business…" /></label><button className="primary" disabled={busy}>Ask Ava ↗</button><p className="fine">OpenAI through Vercel AI Gateway. Advice only; no autonomous publishing or account changes.</p></form>}
      {tab === 'Knowledge base' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/knowledge', { title, content }); setNotice(data.message) }) }}><label>Document title<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Brand voice & customer brief" /></label><label>Knowledge content<textarea required maxLength={12000} value={content} onChange={e => setContent(e.target.value)} placeholder="Add your brand guidelines, offer, or audience research…" /></label><button className="primary" disabled={busy}>Save knowledge</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => { const data = await api('/api/platform/knowledge'); setReply(data.documents.map((d: { title: string; indexed: boolean }) => `${d.title} — ${d.indexed ? 'indexed' : 'Supabase only'}`).join('\n') || 'No documents yet.'); })}>View documents</button><p className="fine">Supabase stores the original. Pinecone indexes vectors in a private per-user namespace.</p></form>}
      {tab === 'Project handoff' && <form onSubmit={e => { e.preventDefault(); if (!window.confirm('Share this project brief with your own DigiMark101 workspace? Personal conversations are not included.')) return; run(async () => { const data = await api('/api/platform/knowledge', { title: 'DigiMark project: ' + title, content }); setNotice(data.message + ' Brief saved to your shared private knowledge base. Open DigiMark101 with the same account to view it.'); }) }}><label>Project name<input required maxLength={140} value={title} onChange={e => setTitle(e.target.value)} /></label><label>Approved project brief<textarea required maxLength={12000} value={content} onChange={e => setContent(e.target.value)} /></label><button className="primary" disabled={busy}>Approve project handoff</button><p className="fine">Only this brief is shared with your own account. This does not deploy a product or grant founder permissions.</p></form>}
      {tab === 'X research' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/x?q=' + encodeURIComponent(query)); setReply(data.posts.map((p: { text: string }) => p.text).join('\n\n') || 'No recent posts found.') }) }}><label>Research a topic<input required maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder="digital marketing lang:en" /></label><button className="primary" disabled={busy}>Search X</button><p className="fine">Read-only recent search. Requires X API access; Ava cannot post to your account.</p></form>}
      <button className="text-button" disabled={busy} onClick={() => run(async () => { await db.auth.signOut(); setReply('') })}>Sign out</button></>}
      {busy && <p role="status">Working…</p>}{notice && <p className="notice" role="status">{notice}</p>}{reply && <div className="answer" aria-live="polite">{reply}</div>}
    </div>
  </section>
}
