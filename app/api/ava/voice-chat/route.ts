import { NextResponse } from 'next/server'
import { AVA_KNOWLEDGE_BASE_VERSION, AVA_SYSTEM_PROMPT } from '@/lib/ava/knowledge-base'

export async function POST(req: Request) {
  const body = await req.json()
  const message = typeof body?.message === 'string' ? body.message : ''

  // AVA_SYSTEM_PROMPT (knowledge base-derived) is sent server-side to the
  // LLM/voice provider once full AI integration is wired up. It is never
  // returned to the client to avoid leaking internal prompt/capability details.
  void AVA_SYSTEM_PROMPT

  return NextResponse.json({
    text: message ? `I heard you say: "${message}". Ava backend is connected and ready for full AI integration.` : 'Ava is ready to help.',
    audioUrl: null,
    knowledgeBaseVersion: AVA_KNOWLEDGE_BASE_VERSION,
  })
}
