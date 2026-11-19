import Image from "next/image"
import Link from "next/link"
import { StartActions } from "@/components/home/start-actions"
import { ContactPath } from "@/components/site/contact-path"
import { hero, trustFacts } from "@/lib/home-content"

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink/10" aria-labelledby="hero-heading">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:py-14 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-16">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <div className="relative mb-4 h-14 w-14 overflow-hidden rounded-full border border-signal/40 lg:hidden">
            <Image
              src="/media/ava-city.jpg"
              alt="Ava Skye"
              fill
              sizes="56px"
              quality={70}
              className="object-cover object-[center_16%]"
            />
          </div>
          <p className="home-kicker">{hero.eyebrow}</p>
          <h1 id="hero-heading" className="display mt-3 max-w-[16ch] text-[2.15rem] text-ink sm:text-5xl lg:text-[3.4rem]">
            {hero.lead}
          </h1>
          <p className="mt-4 max-w-xl font-serif text-2xl leading-snug text-signal sm:text-3xl">{hero.accent}</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">{hero.lede}</p>
          <p className="mt-4 max-w-xl rounded-2xl border border-signal/40 bg-mist px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="font-semibold text-signal">Free beta seat. </span>
            {hero.offer}
          </p>
          <div className="mt-6">
            <StartActions eventPrefix="hero" />
          </div>
          <div className="mt-3">
            <ContactPath event="hero_contact" />
          </div>
          <p className="mt-1 flex flex-col items-start gap-1 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            <Link href="/studio" prefetch={false} className="inline-flex min-h-12 items-center underline decoration-ink/30 underline-offset-4 hover:text-signal">
              Preview Studio before you create an account
            </Link>
            <Link href="/ava" prefetch={false} className="inline-flex min-h-12 items-center underline decoration-ink/30 underline-offset-4 hover:text-signal">
              Talk to Ava
            </Link>
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {trustFacts.map((fact) => (
              <li key={fact.title}>
                <p className="text-sm font-semibold text-ink">{fact.title}</p>
                <p className="text-sm leading-snug text-ink-soft">{fact.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5">
          <div className="relative hidden aspect-[4/5] w-full overflow-hidden rounded-[1.4rem] border border-signal/40 lg:block">
            <Image
              src="/media/ava-city.jpg"
              alt="Ava Skye, the DigiMark101 setup guide, in a dark studio"
              fill
              sizes="420px"
              quality={70}
              className="object-cover object-[center_16%]"
            />
          </div>
          <p className="mt-3 hidden text-sm text-ink-soft lg:block">Ava Skye, pronounced AY-vuh, your setup guide</p>
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs leading-relaxed text-ink-soft">
        Quotes, client logos, and customer counts are not published. A quote is added only after that person approves the words.
      </p>
    </section>
  )
}
