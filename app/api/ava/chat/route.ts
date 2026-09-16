import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 2_000
const MAX_HISTORY_MESSAGES = 12

type Message = { role: 'user' | 'assistant'; content: string }

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_MESSAGE_LENGTH
  )
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const payload = body as { message?: unknown; history?: unknown }
    const message = typeof payload.message === 'string' ? payload.message.trim() : ''

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Enter a message up to 2,000 characters.' }, { status: 400 })
    }

    const history = Array.isArray(payload.history)
      ? payload.history.filter(isMessage).slice(-MAX_HISTORY_MESSAGES)
      : []

    const transcript = history
      .map(({ role, content }) => `${role === 'assistant' ? 'Ava' : 'Client'}: ${content}`)
      .join('\n')

    const { text } = await generateText({
      model: 'xai/grok-4.3',
      system: `You are Ava, the warm, decisive AI guide for DigiMark101, a digital marketing agency. Help visitors turn marketing uncertainty into practical next steps. Be concise, strategic, and clear. Do not claim you performed external actions, accessed private data, or sent messages. If a request needs a human, explain the best next step.\n\nConversation so far:\n${transcript || '(new conversation)'}`,
      prompt: message,
      maxOutputTokens: 600,
    })

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Ava chat request failed', error)
    return NextResponse.json(
      { error: 'Ava is unavailable right now. Please try again shortly.' },
      { status: 503 },
    )
  }
}
