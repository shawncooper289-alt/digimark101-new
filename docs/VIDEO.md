# Video maker

Studio: `/studio/video`. Office: `/video`. Both use the same rules.

A finished film is premium. A request that asks for a lower resolution, a lower frame rate, a faster voice model, or a frozen hold is ignored. If a check cannot be measured, the film is held for a person to review. It is not published until someone approves it.

A preview draft is a branded slideshow with captions. The words "PREVIEW DRAFT" stay on it. It is not lip-synced and it is not a finished video.

## What works before any paid key

- Ava writes a plain-language script from the brief. You can edit it.
- The banned preview sentence is removed from the script and the voice-over.
- Scenes, camera moves, dissolves, captions, and a browser library.
- A downloadable preview draft.
- A social draft on the schedule. It is not posted. A preview is labeled so it is not posted as a finished ad.

The spoken length follows the words. The maker does not freeze the picture to pad the clock.

## Meet Ava

The homepage film is already written. In the office, open `/video` and click **Load the Meet Ava intro**. In Studio, open `/studio/video` and use the same button. Then write the script, make a preview draft, or render a finished video once `HEYGEN_API_KEY`, `AVA_AVATAR_ID`, and a voice id are set.

The script, the shot list, and the caption draft live in `docs/ava-intro-video-script.md` and `docs/ava-intro-video-captions.vtt`. The homepage player reads `NEXT_PUBLIC_AVA_INTRO_VIDEO_URL`. Until that address is set, it shows a Coming soon poster and does not autoplay.

## What a finished video requires

Set the keys, then render. No code change.

| Piece | Env | What it turns on |
| --- | --- | --- |
| Ava's voice clone | `AVA_VOICE_CLONE_ID` plus `ELEVENLABS_API_KEY` | Replaces the temporary premade voice (`ELEVENLABS_VOICE_ID`) everywhere Ava speaks, including the video. |
| Ava's face | `AVA_AVATAR_ID` | The Let's get started avatar. Required before a finished video of Ava starts. |
| Outfit looks | `AVA_AVATAR_LOOKS` | Optional JSON of navy-blazer, black-suit, and tailored-jacket ids. Same person only. |
| Lip sync | `HEYGEN_API_KEY` and `AVA_AVATAR_ID` | HeyGen Avatar 6. Turbo unless `VIDEO_HEYGEN_ENGINE=heygen-avatar-6`. The film sends Ava's ElevenLabs audio. It does not send the ElevenLabs voice id to HeyGen. 1080p. |
| Optional on-camera switch | `VIDEO_TALKING_PROVIDER=grok` and `XAI_API_KEY` | Grok Imagine films Ava. It cannot use her own voice recording unless xAI has approved the account as a partner. Leave this unset to keep her ElevenLabs voice. |
| Cinematic B-roll | `XAI_API_KEY` | Grok Imagine 1.5 is the default. `VIDEO_GROK_MODEL=grok-imagine-video-1.5-lite` is the cheaper model and cannot take reference photos. |
| Ava's photos | `AVA_REFERENCE_IMAGE_URLS` | Up to 14 https links. Grok uses them so cutaways keep her face. Those shots are 720p, which is that model's ceiling, and the finished film is still assembled at 1080p. |
| Other B-roll | `VIDEO_BROLL_PROVIDER=fal` and `FAL_KEY` | Kling 2.5 Turbo unless `VIDEO_FAL_MODEL` names another fal model. |
| Optional mouth pass | `SYNC_API_KEY` and `VIDEO_LIPSYNC_PASS=on` | Sync Labs lipsync-2, only on cutaways where Ava speaks. Off unless both are set. |
| Music | `FAL_KEY` | ACE-Step under the voice. If it fails, the film continues without music. |
| Library | `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` | Jobs and files. Apply `supabase/migrations/20261119_video_jobs.sql`. Do not apply it from the app. |
| Callbacks | `VIDEO_WEBHOOK_SECRET` | HeyGen posts back to the site. A cron also checks jobs that are still working. |
| Editor | `ffmpeg` on the server, or `FFMPEG_PATH` | The cut is a Remotion timeline rendered on the CPU. If ffmpeg is missing, the film stops before any paid call. |
| Client presenters and voices | `VIDEO_STOCK_AVATARS`, `VIDEO_STOCK_VOICES` | JSON list of `{ "id", "label", "note" }`. No usage numbers. |

Chat speech can still use `ELEVENLABS_MODEL`. Finished video speech always asks for `eleven_v4`. Turbo and Flash are not used for a finished video.

## Quality gate

Before a file is called finished, the maker checks:

- The banned line is gone.
- Captions follow each spoken line.
- Talking scenes share one avatar, one voice, and one lighting setup, with a dissolve between them.
- The finished film is 1080p. HeyGen is asked for 1080p, not 4K.
- Frame rate is at least 25 fps. HeyGen avatar video is documented at 25 fps, which is that product's top rate. Other providers are asked for 60 fps.
- Lip sync is inside one frame when it can be measured. If it cannot be measured, a person reviews the mouth. The film is not thrown away.
- Voice and picture lengths match when both were measured.
- No black frame and no frozen hold when those were measured.

A failed check that another cut could fix starts another cut, up to 3 tries. A missing measurement does not spend those retries. The film is published only after Approve.

Ava is pronounced AY-vuh in the voice-over. On-screen captions keep the spelling Ava.
