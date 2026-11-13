# Ava Skye identity

Version `2026.11.12`. The source of truth for code is `lib/ava/identity.ts`. Spoken audio goes through `lib/ava/speech.ts` and the server route `POST /api/ava/speak`. The office uses the same route inside `avaskye-online`.

## Name and pronunciation

Her name is Ava Skye. **Ava is always pronounced AY-vuh, with a strong long A as in able or day** (IPA `/ˈeɪvə/`). It must not sound like AH-vuh, AW-vuh, Awva, or Ah-va.

Screens keep the spelling Ava. Speech does not:

- Server text-to-speech and the browser fallback both receive `Ay-vuh` in place of `Ava`.
- Chat replies, voice chat, onboarding replies, the homepage introduction, and the office all use that same spoken text.
- The current model does not read SSML, so the route sends the phonetic spelling instead of a `<phoneme>` tag.

## Look

Reference images:

- `/media/ava-brand.jpg` — primary portrait
- `/media/ava-digital-presence.jpg` — professional alternate
- `/media/ava-city.jpg` — skyline portrait
- `/media/ava-float-full.png` — floating Studio widget. Same person, tailored blazer, upper body with both hands in the frame

She is a woman with long dark wavy hair, a warm complexion, defined brows, and a steady expression, photographed in a dark studio.

Dress codes:

- **digimark101.com:** professional. Blazer or tailored jacket. Tasteful and non-explicit.
- **avaskye.online:** relaxed daily rotation (cozy knit, tee and joggers, off-shoulder sweater, soft hoodie), tasteful and non-explicit. Visitor mode switches that rotation to the professional blazer until the owner asks for casual again.

## Voice settings

Spoken lines go to `POST /api/ava/speak` on each site. The key stays on the server. The browser's built-in voice is used only when that request fails.

ElevenLabs is the main voice when `ELEVENLABS_API_KEY` and a voice id are set. The OpenAI fallback, including realtime, is model `gpt-4o-mini-tts` and voice `coral`. Coral is the built-in match for a warm, confident young-adult woman with a General American accent, medium pitch, and a moderate conversational pace. The voice stays coral even if `AVA_TTS_VOICE` is set to something else. `AVA_TTS_INSTRUCTIONS` can replace the speaking style. The AY-vuh pronunciation rule is still appended, so an override cannot drop it.

If `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are both set, ElevenLabs is used instead. The voice id comes from that environment variable. It is not written into the code. `ELEVENLABS_VOICE_ID` is a temporary premade voice. When `AVA_VOICE_CLONE_ID` is set, that Instant Voice Clone is used instead. No code change is required. If `AVA_TTS_API_KEY` is unset, OpenAI speech uses `OPENAI_API_KEY`.

Her face in finished videos stays on the 2026-11-11 "Let's get started" clip (`AVA_AVATAR_ID`). Only a business outfit may change. See `docs/VIDEO.md`.

Ava never says "In the theater of life, we are all actors sharing the same scene." She also skips a close paraphrase, a theater-of-life line, or a we-are-all-actors line. That sentence is removed from chat, greetings, video scripts, and speech. If it was the whole line, she says a short hello instead. The rule stays in her instructions even when `AVA_TTS_INSTRUCTIONS` replaces the speaking style, and the speech path drops the sentence before audio is made.

Browser fallback uses `en-US` at rate `1`. Playback starts from the visitor's tap and a new line stops the one already playing.

## Skills

Methods live in `lib/ava/knowledge-base.ts` and on `/studio/knowledge`. They cover pages and funnels, social pages, delegation, client management, other agents, sales conversations, and workspace admin. She drafts. A person confirms before a save. She does not invent proof.
