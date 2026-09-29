import { streamText } from 'ai';
import { z } from 'zod';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

const payload = z.object({ message: z.string().min(1).max(4000), mode: z.enum(['guided', 'self-directed']).default('guided') });

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ error: 'Sign in to chat with Ava.' }, { status: 401 });

  try {
    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (error || !user) return Response.json({ error: 'Your session is invalid.' }, { status: 401 });
  } catch {
    return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Send a valid JSON request body.' }, { status: 400 });
  }
  const parsed = payload.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'A message is required.' }, { status: 400 });
  if (!env.gatewayToken) return Response.json({ error: 'AI Gateway authentication is not configured.' }, { status: 503 });

  const { message, mode } = parsed.data;
  const result = streamText({
    model: 'openai/gpt-oss-120b',
    system: `You are Ava Skye, DigiMark101's expert growth operator. The client is in ${mode} mode. Delegate marketing work only as proposed tasks with a named specialist, measurable completion criteria, and an approval state. Ask one useful question when information is missing. Never claim to execute actions or access data unless the application has confirmed it. Financial, publishing, credential, access-control, or destructive actions must be explicitly approved.`,
    prompt: message,
  });
  return result.toTextStreamResponse();
}
