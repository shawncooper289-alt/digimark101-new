import Image from "next/image"
import { avaIntroVideoUrl } from "@/lib/video/ava-intro"
import { StartActions } from "@/components/home/start-actions"

/**
 * VSL slot. No file is published yet, so this does not embed a video.
 *
 * Script outline, 2–4 minutes, captions on. Hook variants to film later:
 * 1. "You have one offer. The marketing is in six logins."
 * 2. "Ava asks one question at a time and saves only after you say yes."
 * 3. "A beta seat is free while DigiMark101 is in testing. No payment on that form."
 *
 * 1. Problem. A small business is stitching contacts, the page, email, and posts
 *    across tools. Most visitors will not read a long page.
 * 2. Difference. DigiMark101 is the workspace and the studio. Ava fills the
 *    setup and waits for yes. Eight disciplines are planned, then used one at a time.
 * 3. Proof. Only facts already on the site: confirm-before-save, one login,
 *    labeled samples, no invented results. No client logos until someone approves them.
 * 4. Next. Claim a free beta seat at /beta, or write the studio at /contact.
 *
 * Captions spell her name Ava. The voice says AY-vuh. Most people watch muted,
 * so captions are required when a file exists. Shot notes live in lib/video/ava-intro.ts.
 * Set NEXT_PUBLIC_AVA_INTRO_VIDEO_URL to an https file before this player appears.
 */
export async function VslSection() {
  const src = avaIntroVideoUrl()
  const Player = src ? (await import("@/components/home/meet-ava-player")).MeetAvaPlayer : null

  return (
    <section id="film" className="scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="film-heading">
      <div className="home-wrap grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="home-kicker">Film</p>
          <h2 id="film-heading" className="home-title">
            A short film for the visitor who will not read.
          </h2>
          <p className="home-lede">
            The four parts are the problem, what DigiMark101 does differently, proof you can check, and what happens when you claim a seat. Nothing plays until a real file is connected.
          </p>
          <ol className="mt-8 grid gap-3">
            {[
              ["01", "The problem", "The marketing for one offer is split across logins, and most people will not read a long page."],
              ["02", "What we do differently", "Ava asks one question at a time, fills the forms, and saves only after you say yes."],
              ["03", "Proof", "Confirm-before-save, one workspace, and samples that are labeled as samples. No invented clients."],
              ["04", "What happens next", "A free beta seat sends an email link and does not start a payment. Or you write the studio."],
            ].map(([index, title, body]) => (
              <li key={index} className="border-t border-ink/10 pt-3">
                <p className="font-serif text-xl text-signal">{index}</p>
                <h3 className="mt-1 font-serif text-2xl">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[1.4rem] border border-signal/35">
            {Player ? (
              <Player src={src} />
            ) : (
              <div className="relative aspect-video bg-paper">
                <Image
                  src="/media/ava-city.jpg"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover object-[center_18%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/30 to-paper/10" />
                <p className="absolute left-5 top-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-signal">Not published yet</p>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-serif text-3xl text-ink">Ava Skye</p>
                  <p className="mt-1 max-w-md text-sm text-ink-soft">
                    Captions will be on when the film is connected. This frame is a still, not a video.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6">
            <StartActions eventPrefix="film" compact />
          </div>
        </div>
      </div>
    </section>
  )
}
