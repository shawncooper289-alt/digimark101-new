import { captionsVtt } from "./captions"
import { buildScenes } from "./storyboard"
import { wordCount } from "./text"
import type { SceneDirection, VideoBrief } from "./types"

/**
 * Homepage film: Meet Ava.
 * Captions keep the spelling Ava. The video maker says AY-vuh out loud.
 * One avatar id for every talking scene, so the quality gate keeps the same face.
 * The approved all-black reference outfit stays consistent across every scene.
 */

const DISSOLVE = "Dissolve from the previous shot over a short beat. No flash cut and no exposure jump."
const FADE = "Fade in from black over a short beat. Then stay in the same light."

export type IntroShot = {
  chapter: string
  spoken: string
  outfit: string
  setting: string
  camera: string
  broll: string
  transition: string
}

export const INTRO_SHOTS: IntroShot[] = [
  {
    chapter: "What DigiMark101 is",
    spoken: "I'm Ava Skye, your AI assistant inside DigiMark101, helping turn marketing ideas into organized work and useful drafts.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Ava in the reference outfit; real homepage and Studio entry, without a public floating widget.",
    transition: FADE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "Work with me inside Studio, our marketing workspace, or ask about agency services for a project with an agreed scope.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Studio entry and Services page, clearly separating workspace access from agency engagements.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "You bring the offer and the decisions, and I help with supported tasks without expecting you to learn every menu first.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Inside-app Ava panel next to a demonstration task; no invented completed result.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "Inside the app you can talk to me by voice or you can type, using ordinary words to explain your goal.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Ava typing input and microphone controls inside Studio; readable transcript.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "Keep contacts, sales opportunities, campaign planning, and files together in Studio, instead of switching between disconnected notes and drafts.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Contacts, Pipeline, Campaigns, and Files screens with labeled demonstration data.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "This is practical, done-for-you assistance with supported work, not a promise that every outside service is connected or results are guaranteed.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Ava on camera; keep unsupported delivery connections clearly labeled as unavailable.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "I distinguish saved records, drafts, and published results, so you can check what actually happened before moving on.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Readable saved-record and draft status labels; no fake published badge.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Ask me to add a contact, then check the saved record, knowing that adding someone does not message them.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Record a real demonstration contact creation and verify the resulting record; do not message anyone.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Ask me to create a sales opportunity or move a deal, then use the pipeline to see which conversation needs attention.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Record a demonstration deal and its actual stage change, then show the pipeline.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "For content, tell me your audience, offer, and tone, and ask for an email or social draft you can review and refine before using it.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real campaign or social draft input and saved draft; keep draft status visible.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Six helpers support pages and offers, social posts, ad notes, search outlines, follow-up, and research, while I remain the assistant you speak with.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Six labeled helper roles, matching the narration; no invented results or client logos.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "The workspace also supports calendar records, page and form drafts, and files, while the apps catalog shows connection status and the video maker prepares scripts and storyboards.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Calendar, Forms, Sites, Apps status, and video storyboard screens.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "For agency help, explore website design, search engine optimization, ads management, social media, content, email, and analytics, with fees and deliverables agreed in a proposal.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Services page showing website design, SEO, ads, social, content, email, and analytics.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Agency services are separate, not automatically included in a workspace account or carried out by a chat reply.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real agency contact/proposal path; make clear it is separate from workspace access.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Start with one offer and one audience, open Studio, then type a request such as drafting a welcome email for a new customer.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real typed welcome-email request on a demonstration workspace; show the saved draft.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "For voice, allow microphone access when your browser asks, speak clearly, and check the transcript, using typing instead if your device does not support voice.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real browser microphone permission and resulting voice transcript; no simulated recognition.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "You can stop the microphone or my spoken reply, inspect the result on screen, and provide missing details rather than let an ambiguous request become a guess.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real Stop control and transcript review; show missing information being clarified.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "For your first campaign, plan one page, one form, and a short follow-up sequence, then review each piece instead of trying to launch everything at once.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real first-campaign draft: page plan, form, follow-up sequence; all labeled Draft.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Saving a draft does not send an email or publish a website, and sending, publishing, spending, or deleting needs the appropriate access, connections, and confirmations.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real draft and confirmation states; do not suggest that an unconnected send or publish occurred.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Some outside delivery connections are still being built, an invoice record does not charge a card, and a queued message is not proof of delivery.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real invoice record and queued message status with no charge or delivery claim.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "We do not pay you, income is not guaranteed, and results depend on your offer, your effort, your audience, and how you carry out the work.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Ava on camera; subtle income-not-guaranteed text, no money graphics.",
    transition: DISSOLVE,
  },
  {
    chapter: "Start",
    spoken: "Create your account or explore the available Studio preview, bring me one useful task, and type it or speak it inside the app.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Current account and Studio preview links from the real site.",
    transition: DISSOLVE,
  },
  {
    chapter: "Start",
    spoken: "If you want agency help, use the contact path and explain what you want to build, so we can agree on the right next step.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Real agency contact path; no customer details entered.",
    transition: DISSOLVE,
  },
  {
    chapter: "Start",
    spoken: "I am Ava Skye, and we can build your dynasty one practical step at a time, with you in control of the decisions.",
    outfit: "All-black outfit matching the supplied video reference. Same approved Ava face, hair, and look in every scene.",
    setting: "Dark studio, warm soft key light, consistent exposure; actual Studio recordings as cutaways.",
    camera: "Restrained slow push or lateral drift; use readable screen close-ups during demonstrations.",
    broll: "Return to Ava in the same all-black outfit and lighting; finish with a restrained brand end card.",
    transition: DISSOLVE,
  },
]

export const INTRO_SCRIPT = INTRO_SHOTS.map((shot) => shot.spoken.trim()).join(" ")

export const INTRO_MUSIC =
  "One bed for the whole film: felt piano, a soft cello, and a low pulse near 72 beats, with no vocals and no trailer hits. It stays under her voice. The open is almost only piano and the city. The walkthrough can add the pulse. The close returns to piano alone. If the music key is not set, the render stays silent and says so."

function directionFor(shot: IntroShot): SceneDirection {
  return {
    visual: `${shot.outfit} ${shot.setting} ${shot.broll} Same face as the Let's get started avatar. Tasteful business attire only.`,
    camera: shot.camera,
    transition: shot.transition,
  }
}

export function introBrief(): VideoBrief {
  return {
    title: "Meet Ava",
    idea: "Ava explains DigiMark101, what is inside, and how a first day works, in plain words.",
    audience: "Potential customers exploring Studio and agency services",
    offer: "One marketing workspace Ava sets up with you, and you keep",
    cta: "Create your account, explore Studio, or ask about agency services",
    proof: "",
    seconds: 210,
    aspect: "16:9",
    style: "cinematic",
    presenter: "ava",
    stockLabel: "",
    voiceChoice: "",
    attire: "black-suit",
    brand: { primary: "#0b0d0e", accent: "#cbb082", font: "Georgia", logoUrl: "" },
    scriptOverride: INTRO_SCRIPT,
    scenePlan: INTRO_SHOTS.map(directionFor),
  }
}

/** The brief the office and Studio video makers load in one click. */
export const AVA_INTRO_BRIEF = introBrief()

function timedScenes() {
  const brief = introBrief()
  return buildScenes(INTRO_SCRIPT, INTRO_SCRIPT, brief, "ava-face", "ava-voice")
}

export function introScenes() {
  return timedScenes()
}

export function introCaptionsVtt() {
  return captionsVtt(timedScenes())
}

export function introChaptersVtt() {
  const scenes = timedScenes()
  const cues: string[] = []
  let start = 0
  for (let index = 0; index < INTRO_SHOTS.length; index += 1) {
    const next = index + 1
    const chapter = INTRO_SHOTS[index].chapter
    const continues = next < INTRO_SHOTS.length && INTRO_SHOTS[next].chapter === chapter
    if (continues) continue
    const scene = scenes[index]
    const opened = scenes[start]
    if (scene && opened) {
      const stamp = (ms: number) => {
        const clamped = Math.max(0, Math.round(ms))
        const hours = Math.floor(clamped / 3_600_000)
        const minutes = Math.floor((clamped % 3_600_000) / 60_000)
        const seconds = Math.floor((clamped % 60_000) / 1000)
        const millis = clamped % 1000
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`
      }
      cues.push(`${stamp(opened.startMs)} --> ${stamp(scene.endMs)}\n${chapter}`)
    }
    start = next
  }
  return `WEBVTT\n\n${cues.join("\n\n")}\n`
}

export function introChapterTitles() {
  const titles: string[] = []
  for (const shot of INTRO_SHOTS) {
    if (titles[titles.length - 1] !== shot.chapter) titles.push(shot.chapter)
  }
  return titles
}

export function introSpokenSeconds() {
  const scenes = timedScenes()
  const last = scenes[scenes.length - 1]
  return last ? last.endMs / 1000 : wordCount(INTRO_SCRIPT) / 2.35
}

export function introScriptMarkdown() {
  const chapters = introChapterTitles()
  const shots = INTRO_SHOTS.map((shot, index) => {
    return [
      `### Scene ${index + 1} — ${shot.chapter}`,
      "",
      `**Spoken:** ${shot.spoken}`,
      "",
      `**Outfit:** ${shot.outfit}`,
      "",
      `**Setting:** ${shot.setting}`,
      "",
      `**Camera:** ${shot.camera}`,
      "",
      `**B-roll:** ${shot.broll}`,
      "",
      `**Transition:** ${shot.transition}`,
      "",
    ].join("\n")
  }).join("\n")

  const prose = chapters.map((chapter) => {
    const lines = INTRO_SHOTS.filter((shot) => shot.chapter === chapter).map((shot) => shot.spoken)
    return `### ${chapter}\n\n${lines.join(" ")}`
  }).join("\n\n")

  return `# Meet Ava

Three to four minutes, targeting about three and a half. Spoken by Ava Skye. On screen, and in the captions, her name is spelled Ava. Out loud it is AY-vuh, with a long A as in able. The video maker swaps in that pronunciation before any voice is made. You do not type the phonetic spelling into the script.

This is the draft for the replacement homepage film, not a completed render. It says what DigiMark101 is, why it is a better fit than a pile of separate tools, what is actually in the product, how a first day works, and what to do next. It does not invent clients, reviews, rankings, or income.

## Render it in the video maker

Office: open \`/video\`. Studio: open \`/studio/video\`. Both use the same maker.

1. Click **Load the Meet Ava intro**. That fills the title, the idea, a 16:9 cinematic brief, the full script, and this shot list.
2. Click **Write the script**. The script is already written, so this step builds the scenes. You can still edit a line.
3. **Make a preview draft** any time. The draft is labeled. It is not lip-synced, and it is not a finished ad.
4. **Render a finished video** after \`HEYGEN_API_KEY\` (or the generic lip-sync pair), \`AVA_AVATAR_ID\`, and a voice id (\`AVA_VOICE_CLONE_ID\`, or \`ELEVENLABS_VOICE_ID\` until the clone exists) are set. No code change. The maker asks for premium quality: Avatar V, ElevenLabs \`eleven_v4\`, 4K when the account accepts it, otherwise 1080p.
5. When you have a finished file at a stable https address, set \`NEXT_PUBLIC_AVA_INTRO_VIDEO_URL\` to that address and redeploy. The existing short film remains unchanged until the replacement is approved; the Coming soon poster is used only when no URL is configured. It never autoplays with sound.

Every talking scene keeps one avatar id, so the quality check sees the same face. The all-black outfit must match the supplied video reference throughout; no wardrobe changes or substitute face. \`AVA_AVATAR_LOOKS\` can name extra looks of her. It must not point at a different face. The loaded brief selects the black-suit look; approve that look against the uploaded reference before rendering.

## The words

${prose}

## Music

${INTRO_MUSIC}

## Shot list

Same face in every shot. Business attire only. Camera moves stay slow. Cuts are dissolves in one light. UI plates are the real Studio screens, with no made-up numbers on them.

${shots}
## Captions

The captions draft is \`docs/ava-intro-video-captions.vtt\`. Chapter markers are \`docs/ava-intro-video-chapters.vtt\`. Public player tracks are kept separate until the new film is approved. These draft timings follow the words at a calm pace. A finished render may land a little earlier or later. Update the tracks from the maker's caption download if you change a line.

## What this film does not say

No client logos, no testimonials, no awards, and no income promise. Phone, text, email sending, and publishing a site are described only as still being connected. The line about actors sharing a scene is not in this script, and the maker removes it if it is pasted in.
`
}

/** Public config. Used only when the env var is empty. Leave blank until a real file exists. */
export const AVA_INTRO_VIDEO_CONFIG_URL = "/media/ava-intro-film.mp4"

export function avaIntroVideoUrl(value = process.env.NEXT_PUBLIC_AVA_INTRO_VIDEO_URL || AVA_INTRO_VIDEO_CONFIG_URL) {
  const raw = value.trim()
  if (!raw || /^(javascript|data|vbscript):/i.test(raw)) return ""
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw
  try {
    const url = new URL(raw)
    return url.protocol === "https:" ? url.toString() : ""
  } catch {
    return ""
  }
}
