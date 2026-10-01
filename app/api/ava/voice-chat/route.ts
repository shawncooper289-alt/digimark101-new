import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const message = typeof body?.message === 'string' ? body.message : ''

  // NOTE: once full AI integration is wired up, pass
  // `buildAvaSystemPrompt()` from '@/lib/ava/knowledge-base' as the system
  // prompt sent server-side to the LLM/voice provider. It should never be
  // returned to the client, to avoid leaking internal prompt/capability details.

  return NextResponse.json({
    text: message ? `I heard you say: "${message}". Ava backend is connected and ready for full AI integration.` : 'Ava is ready to help.',
    audioUrl: null,
  })
}
