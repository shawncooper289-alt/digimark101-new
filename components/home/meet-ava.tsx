import { MeetAvaPlayer } from "@/components/home/meet-ava-player"
import { introChapterTitles } from "@/lib/video/ava-intro"

export function MeetAva({ src }: { src: string }) {
  const chapters = introChapterTitles()
  return (
    <section id="meet" className="scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="meet-heading">
      <div className="home-wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="home-kicker">Meet Ava</p>
          <h2 id="meet-heading" className="home-title">
            The person who sets it up with you.
          </h2>
          <p className="home-lede">
            Ava Skye is pronounced AY-vuh. She asks one question at a time, fills the forms, and waits for your yes. Press play when you want to hear her. The film does not start by itself.
          </p>
          <ol className="mt-8 grid gap-3">
            {chapters.map((title, index) => (
              <li key={title} className="flex items-baseline gap-4 border-t border-ink/10 pt-3">
                <span className="font-serif text-xl text-signal">0{index + 1}</span>
                <span className="text-ink">{title}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[1.6rem] border border-signal/35 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <MeetAvaPlayer src={src} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Captions spell her name Ava. The voice says AY-vuh. If the film is not connected yet, the poster stays up. Nothing plays with sound until you press it.
          </p>
        </div>
      </div>
    </section>
  )
}
