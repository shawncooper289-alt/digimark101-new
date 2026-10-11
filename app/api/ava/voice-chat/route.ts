import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'A valid JSON request is required.' }, { status: 400 })
  }

  const message =
    typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
      ? body.message.trim()
      : ''

  if (!message || message.length > 4000) {
    return NextResponse.json({ error: 'Message must be between 1 and 4000 characters.' }, { status: 400 })
  }

  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Ava is not configured yet.' }, { status: 503 })
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4.7',
        messages: [
          {
            role: 'system',
            content: 'You are Ava Skye, a helpful, friendly, and concise assistant for DigiMark101.',
          },
          { role: 'user', content: message },
        ],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Grok could not respond right now.' }, { status: 502 })
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const text = data.choices?.[0]?.message?.content

    if (!text) {
      return NextResponse.json({ error: 'Grok returned an empty response.' }, { status: 502 })
    }

    return NextResponse.json({ text, audioUrl: null })
  } catch {
    return NextResponse.json({ error: 'Could not connect to Grok.' }, { status: 502 })
  }
}
