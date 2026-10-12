'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-browser'

export function Coach() {
  const [stage, setStage] = useState('Offer')
  const [goal, setGoal] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    setResult('')
    setBusy(true)
    try {
      if (!supabase) throw new Error('Account service is not configured yet.')
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session) throw new Error('Sign in on the Account page to use Ava.')
      const response = await fetch('/api/ava/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ message: `My marketing bottleneck is ${stage}. My goal: ${goal}` }),
      })
      const reply = await response.json()
      if (!response.ok) throw new Error(reply.error || 'Ava could not respond.')
      if (typeof reply.text !== 'string') throw new Error('Ava returned an invalid response.')
      setResult(reply.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ava is unavailable. Please try again.')
    } finally { setBusy(false) }
  }

  return <form onSubmit={submit}>
    <p className="status">Grok-powered planning for signed-in accounts. Responses are suggestions, not completed actions. <Link href="/account">Account / sign in</Link></p>
    <label htmlFor="stage">Current bottleneck</label>
    <select id="stage" value={stage} onChange={e => setStage(e.target.value)}>{['Offer', 'Leads', 'Conversion', 'Delivery'].map(s => <option key={s}>{s}</option>)}</select>
    <label htmlFor="goal">What do you want to move forward?</label>
    <textarea id="goal" required maxLength={2000} value={goal} onChange={e => setGoal(e.target.value)} />
    <div className="actions"><button className="button" disabled={busy || !supabase}>{busy ? 'Asking Ava…' : 'Ask Ava ↗'}</button></div>
    {!supabase && <p role="status">Supabase public configuration is missing or invalid. Sign-in and Ava are not enabled yet.</p>}
    {error && <p role="alert">{error}</p>}
    {result && <article className="card"><h3>Ava’s suggestion</h3><p style={{ whiteSpace: 'pre-wrap' }}>{result}</p><button type="button" className="outline" onClick={async () => { try { await navigator.clipboard.writeText(result) } catch { setError('Copy unavailable: select the text manually.') } }}>Copy plan</button></article>}
  </form>
}
