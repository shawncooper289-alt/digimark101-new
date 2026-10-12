import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validPublicConfig } from '@/lib/supabase-config'

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) return NextResponse.json({ error: 'Sign in to use Ava.' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_DIGIMARK_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!validPublicConfig(url, key)) {
    return NextResponse.json({ error: 'Account service is not configured yet.' }, { status: 503 })
  }
  try {
    const auth = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await auth.auth.getUser(token)
    if (error || !data.user) return NextResponse.json({ error: 'Sign in again to use Ava.' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Account service is unavailable.' }, { status: 503 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 })
  }
  const message = typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: 'Message must be between 1 and 4000 characters.' }, { status: 400 })
  }
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Ava is not configured yet.' }, { status: 503 })

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4.7',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'You are Ava Skye, a helpful, friendly, concise assistant for DigiMark101. Help plan the next marketing action. Do not claim to execute integrations, publish, or access private data.' },
          { role: 'user', content: message },
        ],
      }),
    })
    if (!response.ok) return NextResponse.json({ error: 'Grok could not respond right now.' }, { status: 502 })
    const data = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> }
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'Grok returned an empty response.' }, { status: 502 })
    return NextResponse.json({ text, audioUrl: null })
  } catch {
    return NextResponse.json({ error: 'Could not connect to Grok. Please try again.' }, { status: 502 })
  }
}
