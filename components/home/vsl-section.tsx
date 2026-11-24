import { StartActions } from "@/components/home/start-actions"
import { MeetAvaPlayer } from "@/components/home/meet-ava-player"

/**
 * VSL slot. Video is now connected at /media/ava-intro-film.mp4.
 * Captions and chapters load from /captions/.
 */
export function VslSection() {
  const src = "/media/ava-intro-film.mp4"

  return (
    <section id="film" className="scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="film-heading">
      <div className="home-wrap grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="home-kicker">Film</p>
          <h2 id="film-heading" className="home-title">
            Watch Ava explain it in under a minute.
          </h2>
          <p className="home-lede">
            See the problem of scattered tools, how Ava guides you one step at a time, the one workspace you keep, and how to start with a free beta seat. Press play.
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
            <MeetAvaPlayer src={src} />
          </div>
          <div className="mt-6">
            <StartActions eventPrefix="film" compact />
          </div>
        </div>
      </div>
    </section>
  )
}
