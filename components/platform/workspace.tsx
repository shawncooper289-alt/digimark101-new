'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function Workspace() {
  const [db] = useState<SupabaseClient | null>(() => {
    const url = (process.env.NEXT_PUBLIC_digimark101_SUPABASE_URL || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = (process.env.NEXT_PUBLIC_digimark101_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_digimark101_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    if (!url || !key) return null
    try { return createClient(url, key) } catch { return null }
  })
  const generation = useRef(0)
  const [brief, setBrief] = useState({ business: '', website: '', offer: '', audience: '', goal: '', brandVoice: '', budget: '', compliance: '' })
  const [hasWebsite, setHasWebsite] = useState('no')
  const [consent, setConsent] = useState(false)
  const [reviewId, setReviewId] = useState('')
  const [findings, setFindings] = useState('')
  const [mode, setMode] = useState('guided')
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('Onboarding')
  const [reply, setReply] = useState('')
  useEffect(() => {
    if (!db) return
    const counter = generation
    let active = true
    function reset(next: string) { if (!active) return; generation.current++; setToken(next); setBrief({ business: '', website: '', offer: '', audience: '', goal: '', brandVoice: '', budget: '', compliance: '' }); setReply(''); setNotice(''); setMessage(''); setTitle(''); setContent(''); setQuery(''); setMode('guided'); setHasWebsite('no'); setConsent(false); setReviewId(''); setFindings('') }
    db.auth.getSession().then(({ data }) => reset(data.session?.access_token || ''))
    const { data } = db.auth.onAuthStateChange((_, session) => reset(session?.access_token || ''))
    return () => { active = false; counter.current++; data.subscription.unsubscribe() }
  }, [db])
  async function run(action: () => Promise<void>) {
    setBusy(true); setNotice('')
    try { await action() } catch (e) { setNotice(e instanceof Error ? e.message : 'Request failed.') }
    finally { setBusy(false) }
  }
  async function api(path: string, body?: object, method?: string) {
    const current = generation.current
    const res = await fetch(path, { method: method || (body ? 'POST' : 'GET'), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json()
    if (current !== generation.current) throw new Error('Account changed; response discarded.')
    if (!res.ok) throw new Error(data.error || 'Request failed.')
    return data
  }
  return <section id="workspace" className="section workspace">
    <div className="eyebrow">YOUR GROWTH COMMAND CENTER</div><h2>Meet your next move.</h2><p className="muted">Ava brings strategy, your private knowledge, and social research into one workspace.</p>
    <div className="panel">
      <div className="tabs">{['Onboarding', 'Ava chat', 'Knowledge base', 'X research', 'Skills & integrations'].map(t => <button key={t} className={tab === t ? 'selected' : ''} onClick={() => { setTab(t); setReply('') }}>{t}</button>)}<span className="session-label">{token ? 'Private workspace' : 'Sign in required'}</span></div>
      {!db ? <div className="setup">Add your public Supabase URL and anon key in Vercel Settings, then redeploy to enable sign-in.</div> : !token ? <form className="auth" onSubmit={e => { e.preventDefault(); run(async () => {
        const result = otp ? await db.auth.verifyOtp({ email, token: otp, type: 'email' }) : await db.auth.signInWithOtp({ email })
        if (result.error) throw result.error
        setNotice(otp ? 'Signed in.' : 'Check your email. Use the sign-in link, or enter the email code if your template includes one.')
      }) }}><label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" /></label><label>Email code (optional)<input value={otp} onChange={e => setOtp(e.target.value)} autoComplete="one-time-code" /></label><button className="primary" disabled={busy}>{otp ? 'Verify code' : 'Send sign-in email'}</button></form> : <>
      {tab === 'Onboarding' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/onboarding', { mode, brief: { ...brief, website: hasWebsite === 'yes' ? brief.website : '' } }); setNotice(data.message) }) }}>
        <h3>Your private business brief</h3><label>Working mode<select value={mode} onChange={e => setMode(e.target.value)}><option value="guided">Ava guided</option><option value="self-directed">Self-directed</option></select></label>
        <label>Do you already have a website?<select value={hasWebsite} onChange={e => { setHasWebsite(e.target.value); setReviewId(''); setFindings(''); setConsent(false) }}><option value="no">Not yet</option><option value="yes">Yes</option></select></label>
        {hasWebsite === 'yes' && <div><label>Public website URL<input type="url" value={brief.website} onChange={e => { setBrief(current => ({ ...current, website: e.target.value })); setReviewId(''); setFindings(''); setConsent(false) }} placeholder="https://your-business.com" /></label>
          <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> I permit this public URL/content to be processed by the website reader and AI provider to draft my business brief.</label>
          <button type="button" disabled={busy || !consent || !brief.website} onClick={() => run(async () => { const data = await api('/api/platform/website', { url: brief.website, consent }); setReviewId(data.id); setFindings(data.findings); setNotice(data.scope + ' Review and correct the findings before confirming.') })}>Read website with Ava</button>
          <p>Reads one public page, not your entire website. Review important product-page URLs separately. No login access or automatic promotion.</p>
          {reviewId && <div><label>Draft findings — edit before confirming<textarea value={findings} maxLength={12000} onChange={e => setFindings(e.target.value)} /></label><button type="button" disabled={busy || !findings.trim()} onClick={() => run(async () => { const data = await api('/api/platform/website', { id: reviewId, findings, confirm: true }, 'PATCH'); setNotice(data.message) })}>Confirm these business details</button></div>}
        </div>}
        {Object.entries(brief).filter(([key]) => key !== 'website').map(([key, value]) => <label key={key}>{key}<textarea maxLength={2000} required={['business', 'offer', 'audience', 'goal'].includes(key)} value={value} onChange={e => setBrief(current => ({ ...current, [key]: e.target.value }))} /></label>)}
        <button className="primary" disabled={busy}>Save onboarding</button><button className="secondary" type="button" disabled={busy} onClick={() => run(async () => { const data = await api('/api/platform/onboarding'); if (data.onboarding) { setBrief(data.onboarding.brief); setMode(data.onboarding.mode); setHasWebsite(data.onboarding.brief.website ? 'yes' : 'no'); setNotice('Saved brief loaded.') } else setNotice('No saved brief yet.') })}>Load saved brief</button>
        <p>One private workspace per account. Team membership and shared workspaces are not enabled.</p>
      </form>}
      {tab === 'Skills & integrations' && <div><p>Ava can advise, draft and plan. External execution requires separately implemented, authorized tools.</p><button className="primary" disabled={busy} onClick={() => run(async () => { const data = await api('/api/platform/capabilities'); setReply(data.skills.map((s: { name: string; mode: string }) => `${s.name}: ${s.mode}`).join('\n') + '\n\n' + Object.entries(data.integrations).map(([name, value]) => `${name}: ${(value as { status: string }).status}`).join('\n')) })}>Check skills and integration configuration</button></div>}
      {tab === 'Ava chat' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/chat', { message }); setReply(data.text); setNotice(`${data.retrieval}. Sources: ${data.sources.join(', ') || 'Ava core knowledge'}.${data.saved ? '' : ' Conversation could not be saved.'}`) }) }}><label>Your growth challenge<textarea required maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Help me plan a launch for my business…" /></label><button className="primary" disabled={busy}>Ask Ava ↗</button><p className="fine">OpenAI through Vercel AI Gateway. Advice only; no autonomous publishing or account changes.</p></form>}
      {tab === 'Knowledge base' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/knowledge', { title, content }); setNotice(data.message) }) }}><label>Document title<input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Brand voice & customer brief" /></label><label>Knowledge content<textarea required maxLength={12000} value={content} onChange={e => setContent(e.target.value)} placeholder="Add your brand guidelines, offer, or audience research…" /></label><button className="primary" disabled={busy}>Save knowledge</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => { const data = await api('/api/platform/knowledge'); setReply(data.documents.map((d: { title: string; indexed: boolean }) => `${d.title} — ${d.indexed ? 'indexed' : 'Supabase only'}`).join('\n') || 'No documents yet.'); })}>View documents</button><p className="fine">Supabase stores the original. Pinecone indexes vectors in a private per-user namespace.</p></form>}
      {tab === 'X research' && <form onSubmit={e => { e.preventDefault(); run(async () => { const data = await api('/api/platform/x?q=' + encodeURIComponent(query)); setReply(data.posts.map((p: { text: string }) => p.text).join('\n\n') || 'No recent posts found.') }) }}><label>Research a topic<input required maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder="digital marketing lang:en" /></label><button className="primary" disabled={busy}>Search X</button><p className="fine">Read-only recent search. Requires X API access; Ava cannot post to your account.</p></form>}
      <button className="text-button" disabled={busy} onClick={() => run(async () => { await db.auth.signOut(); setReply('') })}>Sign out</button></>}
      {busy && <p role="status">Working…</p>}{notice && <p className="notice" role="status">{notice}</p>}{reply && <div className="answer" aria-live="polite">{reply}</div>}
    </div>
  </section>
}
