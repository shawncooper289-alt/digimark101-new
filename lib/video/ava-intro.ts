import { captionsVtt } from "./captions"
import { buildScenes } from "./storyboard"
import { wordCount } from "./text"
import type { SceneDirection, VideoBrief } from "./types"

/**
 * Homepage film: Meet Ava.
 * Captions keep the spelling Ava. The video maker says AY-vuh out loud.
 * One avatar id for every talking scene, so the quality gate keeps the same face.
 * Outfit changes live in the motion direction, not in a second person.
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
    spoken: "I'm Ava Skye, and if you want to make money online, this is the place to start.",
    outfit: "Navy blazer over an ivory blouse. Same face, hair down, tasteful business attire.",
    setting: "Dark studio at night. Warm key light. Soft city lights through the glass. Gold and cream, never a new color palette.",
    camera: "Slow push-in from a waist-up frame to her face. The city stays soft. The move never stops.",
    broll: "None. Ava fills the frame.",
    transition: FADE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "DigiMark101 is a marketing workspace and a studio, and that workspace is called Studio.",
    outfit: "Navy blazer, same look.",
    setting: "Same studio and the same light.",
    camera: "Gentle drift to a three-quarter angle, then ease back to her eyes.",
    broll: "The word Studio fades onto a glass panel in gold, then leaves. No chart and no logo lockup of another company.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "Your people, your drafts, your files, and the path of a sale all live in one login.",
    outfit: "Navy blazer, same look.",
    setting: "Same studio.",
    camera: "A slight rise as the camera gives the glass panel a little room, then returns to Ava.",
    broll: "Four quiet words on the glass: people, drafts, files, sales. They dissolve off.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "I am the assistant in the middle of it, and you can talk to me by voice or you can type.",
    outfit: "Navy blazer, same look.",
    setting: "Same studio. A small microphone glow, not a gadget ad.",
    camera: "Slow arc from her shoulder back to a steady medium close-up.",
    broll: "A voice wave and a typed line share one card, then dissolve. No autoplay sound in the plate.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "I ask one plain question at a time, I fill in the forms, and I save a change only after you say yes.",
    outfit: "Navy blazer, same look.",
    setting: "Same light. She is seated now, still in the blazer.",
    camera: "Slow push-in that lands as she says yes. Keep a little drift so the picture stays alive.",
    broll: "A form fills itself, then waits on a Yes button. The button is not pressed until the line says so.",
    transition: DISSOLVE,
  },
  {
    chapter: "What DigiMark101 is",
    spoken: "You do not have to learn every menu before you can start, and that is the done-for-you setup.",
    outfit: "Navy blazer, same look.",
    setting: "Same studio, a little wider.",
    camera: "Drift wider to show the room, then settle on her with the move still breathing.",
    broll: "None.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "Most tools hand you a menu and leave you there, and some pile on calling, texting, and payments before you know your offer.",
    outfit: "Change, on the dissolve, into a black suit with a simple blouse. Same person, same hair, same light.",
    setting: "Same studio. A dim row of blank screens sits behind her, out of focus.",
    camera: "Slow lateral move past the blank screens, then back to Ava. No other company's logo.",
    broll: "Empty screens only. No fake dashboards.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "DigiMark101 is one system you can grow with me beside you, and I will say what is still being connected.",
    outfit: "Black suit, same look.",
    setting: "Same light, closer.",
    camera: "Steady push-in. A thin gold rule draws on, then dissolves away.",
    broll: "Two short labels, Works today and Still connecting, in the brand colors. No numbers.",
    transition: DISSOLVE,
  },
  {
    chapter: "Why this is the better choice",
    spoken: "I will not invent a client, a review, or a number, and if a piece is not ready, I say so.",
    outfit: "Black suit, same look.",
    setting: "Same light, quiet.",
    camera: "A calm close-up with a very slow drift. The picture keeps moving.",
    broll: "None.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "When a draft is long, six helpers work with me: pages and offers, social posts, ad notes, search outlines, follow-up, and research.",
    outfit: "Change, on the dissolve, into a tailored jacket. Same person. Seated at a dark walnut desk.",
    setting: "The desk, a laptop with the Studio screen, warm practical lamp, same exposure as the studio.",
    camera: "Slow push across the desk as six plain cards appear one by one, then dissolve back toward Ava.",
    broll: "Six cards only, with those six jobs. No seventh card. Brand colors. No stock photos of a crowd.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "A seventh job waits, I still speak in one voice, and nothing is sent, posted, or spent until you confirm.",
    outfit: "Tailored jacket, same look.",
    setting: "Same desk.",
    camera: "Dissolve from the cards back to her face. A small nod in the motion. Same light.",
    broll: "The six cards fade. One card marked Next waits at the side, dimmer.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Inside Studio you can keep contacts, move a deal, book a time, draft an email, plan a page, and save a file.",
    outfit: "Tailored jacket, same look.",
    setting: "Same desk. The laptop becomes the subject for a moment.",
    camera: "Lateral drift from Ava to the screen, then drift back to her. One continuous move.",
    broll: "Real Studio surfaces only: contacts, pipeline stages from new to won, calendar, an email draft, a page plan, files. No invented metrics.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "The apps catalog shows what is ready to connect and what is still coming.",
    outfit: "Tailored jacket, same look.",
    setting: "Same desk.",
    camera: "The catalog list slides under a soft gold highlight, then the camera returns to Ava.",
    broll: "Apps catalog rows with plain status words such as works and coming soon. No partner logos treated as clients.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "The video maker writes a script and, once the avatar and video keys are set, can render a finished video of me.",
    outfit: "Tailored jacket, same look.",
    setting: "Same desk, then a storyboard wall of this same film.",
    camera: "Slow push along the storyboard frames, dissolving into Ava.",
    broll: "This shot list as simple frames. A small note that finished video needs the avatar and video keys. No fake play count.",
    transition: DISSOLVE,
  },
  {
    chapter: "What you get",
    spoken: "Until those keys are set, you still get a labeled preview draft, not a finished ad.",
    outfit: "Tailored jacket, same look.",
    setting: "Same desk.",
    camera: "A preview card enters and leaves on a dissolve. Ava stays in the light.",
    broll: "A card that reads PREVIEW DRAFT. It is not lip-synced and it is not a finished ad.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Here is a first day, step by step.",
    outfit: "Change back to the navy blazer on the dissolve. Same person. She is standing by the window.",
    setting: "The studio window, city behind her, then she turns toward the desk.",
    camera: "She turns from the window toward the desk. The camera follows with a slow drift.",
    broll: "None.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Create an account, or join the free beta with an email sign-in link and no PayPal step.",
    outfit: "Navy blazer, same look.",
    setting: "Seated again. Screen beside her.",
    camera: "Drift from Ava to the signup screen, then back.",
    broll: "The create-account screen and the beta form. No personal data typed on screen. No PayPal button on the beta form.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Open Studio, or just talk to me, and tell me the one thing you want to sell and who it is for.",
    outfit: "Navy blazer, same look.",
    setting: "Ava and a chat panel in the same frame.",
    camera: "Slow push toward her, with the chat panel sharing the frame.",
    broll: "A short typed question and her reply. Plain words. No customer names.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "I draft the setup on the screen, you read it, and you say yes before it is saved.",
    outfit: "Navy blazer, same look.",
    setting: "The confirm step, large and calm.",
    camera: "Move from the draft to her eyes as the yes lands. Keep the drift.",
    broll: "A draft card and a confirm control. The save happens only after the spoken yes.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Then finish one real piece: add a person, move a deal, or use the first-campaign path for one page, one form, and three follow-up emails.",
    outfit: "Navy blazer, same look.",
    setting: "Studio UI as plates beside her.",
    camera: "One continuous drift across three UI plates, then back to Ava. Not a hard slideshow cut.",
    broll: "A new contact, a deal moving stage, and a first-campaign draft of one page, one form, and three emails.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "Approving saves the draft, and it does not publish a website or send the email until those connections are turned on.",
    outfit: "Navy blazer, same look.",
    setting: "Same frame. The draft stays marked as a draft.",
    camera: "Ease back from the screen to Ava. The picture keeps a slight move.",
    broll: "The word Draft stays on the card. No send animation.",
    transition: DISSOLVE,
  },
  {
    chapter: "How a first day works",
    spoken: "We do not pay you, income is not guaranteed, and it depends on your offer, your effort, and the people you reach.",
    outfit: "Navy blazer, same look.",
    setting: "Quiet medium shot. No money graphics.",
    camera: "Calm medium shot with a slow drift. No coins, no rising chart, no crowd.",
    broll: "None.",
    transition: DISSOLVE,
  },
  {
    chapter: "Start",
    spoken: "Bring one offer, create your account or talk to me, and leave with a workspace you can keep.",
    outfit: "Navy blazer, same look. She steps a little closer.",
    setting: "Wider studio, city behind her, gold rim light.",
    camera: "Wider shot, then a slow push-in as she steps closer.",
    broll: "Three quiet words at the lower third: Account, Beta, Talk. They dissolve off before the last line.",
    transition: DISSOLVE,
  },
  {
    chapter: "Start",
    spoken: "I am Ava Skye, and we can build your dynasty one yes at a time.",
    outfit: "Navy blazer, same look.",
    setting: "Close, warm key, gold rim. Same face as the open.",
    camera: "Final close-up with a slow drift. After the line, dissolve toward black while the picture is still moving.",
    broll: "None. End on Ava.",
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
    audience: "Beginners who want to make money online",
    offer: "One marketing workspace Ava sets up with you, and you keep",
    cta: "Create your account, join the beta, or talk to Ava",
    proof: "",
    seconds: 180,
    aspect: "16:9",
    style: "cinematic",
    presenter: "ava",
    stockLabel: "",
    voiceChoice: "",
    attire: "navy-blazer",
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

About three minutes. Spoken by Ava Skye. On screen, and in the captions, her name is spelled Ava. Out loud it is AY-vuh, with a long A as in able. The video maker swaps in that pronunciation before any voice is made. You do not type the phonetic spelling into the script.

This is the homepage film. It says what DigiMark101 is, why it is a better fit than a pile of separate tools, what is actually in the product, how a first day works, and what to do next. It does not invent clients, reviews, rankings, or income.

## Render it in the video maker

Office: open \`/video\`. Studio: open \`/studio/video\`. Both use the same maker.

1. Click **Load the Meet Ava intro**. That fills the title, the idea, a 16:9 cinematic brief, the full script, and this shot list.
2. Click **Write the script**. The script is already written, so this step builds the scenes. You can still edit a line.
3. **Make a preview draft** any time. The draft is labeled. It is not lip-synced, and it is not a finished ad.
4. **Render a finished video** after \`HEYGEN_API_KEY\` (or the generic lip-sync pair), \`AVA_AVATAR_ID\`, and a voice id (\`AVA_VOICE_CLONE_ID\`, or \`ELEVENLABS_VOICE_ID\` until the clone exists) are set. No code change. The maker asks for premium quality: Avatar V, ElevenLabs \`eleven_v4\`, 4K when the account accepts it, otherwise 1080p.
5. When you have a finished file at a stable https address, set \`NEXT_PUBLIC_AVA_INTRO_VIDEO_URL\` to that address and redeploy. Until then the homepage player shows the Coming soon poster. It never autoplays with sound.

Every talking scene keeps one avatar id, so the quality check sees the same face. Wardrobe changes are motion direction for that same person: navy blazer, black suit, then a tailored jacket, then the navy blazer again. \`AVA_AVATAR_LOOKS\` can name extra looks of her. It must not point at a different face. The loaded brief starts in the navy blazer.

## The words

${prose}

## Music

${INTRO_MUSIC}

## Shot list

Same face in every shot. Business attire only. Camera moves stay slow. Cuts are dissolves in one light. UI plates are the real Studio screens, with no made-up numbers on them.

${shots}
## Captions

The captions draft is \`docs/ava-intro-video-captions.vtt\`. Chapter markers are \`docs/ava-intro-video-chapters.vtt\`. The homepage player loads the same tracks. Timings follow the words at a calm pace. A finished render may land a little earlier or later. Update the tracks from the maker's caption download if you change a line.

## What this film does not say

No client logos, no testimonials, no awards, and no income promise. Phone, text, email sending, and publishing a site are described only as still being connected. The line about actors sharing a scene is not in this script, and the maker removes it if it is pasted in.
`
}

/** Public config. Used only when the env var is empty. Leave blank until a real file exists. */
export const AVA_INTRO_VIDEO_CONFIG_URL = ""

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
