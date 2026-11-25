# Meet Ava — detailed landing-page film

**Status: production brief and narration draft; not rendered or approved for release.**

## Deliverable

One embedded, chaptered 16:9 film, three to four minutes (180–240 seconds) at a calm pace, assembled from short generated presenter clips and real product demonstrations. Length follows clear explanations, not repeated lines or padded footage. This is a replacement for the short introduction only after the complete film passes review. Do not loop, stretch, or concatenate the supplied reference clip and call it the finished film.

## Identity and continuity lock

- Ava's face, hair, and all-black outfit must match the supplied `generated_video-10.mp4` reference. The extracted `public/media/ava-black-outfit.jpg` is a still reference, not a new high-resolution source.
- Request the original high-resolution reference before final close-up production: the upload is 448×672 at 24 fps. Upscaling cannot recover missing detail.
- Keep the same approved avatar/look and voice in every presenter clip; no wardrobe changes or face substitutions. Confirm the provider's avatar matches the reference before spending credits on the whole film.
- Say Ava as AY-vuh; captions spell Ava. Confident, warm delivery, not a rushed sales pitch.
- Dark-and-gold set, soft warm key light, stable skin tone, restrained camera motion, no abrupt exposure or framing jumps.
- Generate one continuous narration master, then split at sentence boundaries for short lip-synced clips. Retain audio handles for editing; never cut a word or independently regenerate the voice at every join.
- Use real Studio recordings with clearly labeled demonstration data, never customer records. Verify each action and its saved result before including the take.

## Narration and picture plan

The single source of narration and shot directions is `lib/video/ava-intro.ts`, loaded by **Load the Meet Ava intro** in the video maker. The readable draft is `docs/ava-intro-video-script.md`. It targets 210 seconds in a 16:9 cinematic brief, using one approved black-suit look matching the supplied reference throughout. Tests verify an estimated spoken duration between 180 and 240 seconds and that every sentence has a scene without exceeding the maker's 50-scene limit. These are planning checks, not proof of final media duration.

The five chapters cover the offer, the workspace, concrete services, typing/voice demonstrations, limits and next steps. Capture real product demonstrations, and replace generic cutaway directions with the exact matching screens in the edit. The final exported file **must measure 180–240 seconds**, including titles and the closing beat. Aim for 3:30–3:45; tighten narration or revise delivery if it misses the range, rather than padding or cutting a sentence.

## Maker selection and existing rebuild

There is no independently established universal “best” video maker. For Ava's presenter footage, evaluate HeyGen Avatar 6 with the approved avatar, starting with a short paid test before committing to the film. HeyGen's current Digital Twin guide recommends Avatar 6 and requires checking the look's `supported_api_engines`; its higher-quality result must be judged on Ava's actual face and voice, not a product label. Source: https://developers.heygen.com/generate-avatar-video (checked 2026-11-25).

An existing, unmerged maker rebuild is already tracked in PR #99. Its proposed architecture includes saved server jobs, separate narration, presenter clips, cinematic B-roll, assembly, and human approval. This brief does not claim that rebuild is deployed, reviewed, or working. Review it rather than create a competing rendering system. Do not merge blindly: verify credentials, avatar support, storage, renderer availability, spend limits, and a small end-to-end render first. The current main-branch maker still uses its existing Avatar V adapter; this PR does not silently change that adapter or advertise it as the newest model.

## Render and assembly handoff

1. Review this narration against the deployed product. Approve the script and one 10–15 second identity/voice test before rendering the full batch.
2. Use the app's configured presenter-video provider with the approved Ava avatar ID and voice. The project's preview configuration currently has no avatar ID or finished-video provider key. Do not put credentials in this document, a chat, or the repository.
3. Split narration into short clips at natural sentence boundaries within provider limits. Number assets by chapter and shot, retaining the same avatar, outfit, voice, resolution, frame rate, and lighting. Capture demonstrations separately from generated footage.
4. Edit clips into one master. Favor audio-continuous screen recordings at joins; use restrained dissolves when returning to Ava. Match loudness and room tone, preserve speech intelligibility, and keep music well below her voice. No repeated greetings between clips, frozen padding, abrupt word cuts, or watermark-bearing takes.
5. Verify the final measured duration is 180–240 seconds with no frozen padding. Deliver a high-quality 16:9 master and a web-optimized MP4 with fast-start metadata; 1080p minimum, higher-resolution master where genuinely supported. Never label an upscaled low-resolution reference as newly captured 4K detail.
6. Generate captions and chapters from the final edit, not estimated draft timing. Review every word, name, and chapter boundary. Do not reuse the current short clip's timing or estimated draft script tracks.
7. Watch the entire assembled film with sound and with captions. Inspect lip-sync, identity continuity, hands, mouth artifacts, missing words, cut points, black frames, repeated frames, and screen readability. Automated metadata checks alone do not certify perfection.
8. Obtain owner approval of the complete film. Then connect the final stable asset URL to the existing landing-page player, replace caption/chapter tracks together, and verify play, pause, seek, captions, mute, fullscreen, and mobile layout on a preview. Keep playback opt-in; no autoplay with sound.

**Not completed by this brief:** avatar creation, voice selection approval, provider render jobs, screen recording, final editing, final captions, owner acceptance, or replacement of the live film.
