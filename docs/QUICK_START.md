# Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Add your xAI API key to `.env.local` as `XAI_API_KEY`. Optionally set `XAI_MODEL` to the Grok model you want to use.
4. Run Supabase SQL from `/supabase/migrations/initial_schema.sql`.
5. Start app:
   ```bash
   npm run dev
   ```

The Ava voice-chat backend sends recognized text to xAI's Grok API. The API key stays on the server; browser speech recognition remains local to the browser.
