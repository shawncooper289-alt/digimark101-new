# Quick start

## Requirements

- Node.js 20 or newer
- npm

Accounts you can add later, not before the first local run:

- [Supabase](https://supabase.com) to store contact notes
- [xAI](https://console.x.ai/) or [OpenAI](https://platform.openai.com/api-keys) for live Ava replies

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Leave the keys blank at first. Ava uses the studio guide, and the contact form tells you the note was not stored.

## Store a lead locally

1. Create a Supabase project.
2. Run `supabase/migrations/20261015_leads.sql` in the SQL editor.
3. Put the project URL, the **anon** key, and the **service_role** key in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

4. Restart `npm run dev` and submit the contact form. The success state should say the studio has the note.

## Turn on live Ava

Set one of these in `.env.local` and restart:

```bash
XAI_API_KEY=your_xai_key
XAI_MODEL=grok-4.7
```

or:

```bash
OPENAI_API_KEY=sk-your_key
OPENAI_MODEL=gpt-4o-mini
```

The widget badge switches from "Studio guide" to "Live model".

## Open the studio

Visit http://localhost:3000/studio. Without Supabase this is a labeled browser preview. After the platform migration and a sign-in, the same screens read and write only that user's rows.

Voice is the Voice toggle in Ava's panel. It uses the browser. There is no speech API key. Chrome or Edge is required for dictation. On the contact page, say "my name is …, email …" and Ava fills the fields.

Voice input works in Chromium browsers that expose the Web Speech API. Allow the microphone when asked. Safari and Firefox can still type.

## Production

Follow [DEPLOY.md](./DEPLOY.md) to put the site on Vercel and attach www.digimark101.com.
