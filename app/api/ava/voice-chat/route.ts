import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const message = typeof body?.message === 'string' ? body.message : ''

  return NextResponse.json({
    text: message ? `I heard you say: "${message}". Ava backend is connected and ready for full AI integration.` : 'Ava is ready to help.',
    audioUrl: null,
  })
}
