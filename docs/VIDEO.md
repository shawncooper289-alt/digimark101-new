# Video maker

Studio: `/studio/video`. Office: `/video`. Both use the same rules.

A finished video is premium only. The setting is locked. A request that asks for a lower resolution, a lower frame rate, a faster voice model, or a frozen hold is ignored. If the picture cannot be checked, it is not marked finished.

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
| Lip sync | `HEYGEN_API_KEY` or `VIDEO_LIPSYNC_PROVIDER=heygen` with `VIDEO_LIPSYNC_API_KEY` | HeyGen v3 studio render. Avatar V, ElevenLabs `eleven_v4`, 4K when the account accepts it, otherwise 1080p. Never 720p. |
| Other lip-sync API | `VIDEO_LIPSYNC_PROVIDER=generic`, `VIDEO_LIPSYNC_API_KEY`, `VIDEO_LIPSYNC_API_URL`, `VIDEO_LIPSYNC_STATUS_URL` (must contain `{id}`) | Posts the premium job to that URL. |
| Animated or no-presenter footage | `VIDEO_BROLL_API_KEY`, `VIDEO_BROLL_API_URL`, `VIDEO_BROLL_STATUS_URL` | Cinematic plates and motion graphics. |
| Music | `VIDEO_MUSIC_API_KEY`, `VIDEO_MUSIC_API_URL` | One soundtrack request. If it fails, the note says there is no soundtrack. |
| Client presenters and voices | `VIDEO_STOCK_AVATARS`, `VIDEO_STOCK_VOICES` | JSON list of `{ "id", "label", "note" }`. No usage numbers. |

Chat speech can still use `ELEVENLABS_MODEL`. Finished video speech always asks for `eleven_v4`. Turbo and Flash are not used for a finished video.

## Quality gate

Before a file is called finished, the maker checks:

- The banned line is gone.
- Captions follow each spoken line.
- Talking scenes share one avatar, one voice, and one lighting setup, with a dissolve between them.
- Resolution is 1080p or 4K. 4K is requested first. If the account refuses 4K, the next render asks for 1080p and says so.
- Frame rate is at least 25 fps. HeyGen avatar video is documented at 25 fps, which is that product's top rate. Other providers are asked for 60 fps.
- Lip sync is inside one frame. If the service does not confirm the offset, the file is not delivered.
- Voice and picture lengths match.
- No black frame and no frozen hold.

A failed check starts another render, up to 3 tries, when another render could change the result. A missing measurement does not get three paid retries. The failed file is not offered as the download.

Ava is pronounced AY-vuh in the voice-over. On-screen captions keep the spelling Ava.
