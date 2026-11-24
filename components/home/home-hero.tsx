import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { AvaIntroButton } from "@/components/home/ava-intro-button"
import { TrackedLink } from "@/components/site/tracked-link"
import { hero } from "@/lib/home-content"

export function HomeHero() {
  return (
    <section className="home-hero relative isolate overflow-hidden border-b border-ink/10" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
        <div className="lg:col-span-7">
          <p className="home-kicker">{hero.eyebrow}</p>
          <h1 id="hero-heading" className="display mt-6 max-w-[12ch] text-[clamp(3rem,6vw,5.5rem)] leading-[1.03]">
            {hero.lead}
          </h1>
          <p className="mt-6 max-w-lg font-serif text-2xl leading-snug text-signal sm:text-3xl">{hero.accent}</p>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">{hero.lede}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink href="/beta" event="hero_beta" className="btn btn-signal">
              Explore the free beta <ArrowRight size={17} aria-hidden="true" />
            </TrackedLink>
            <TrackedLink href="/contact" event="hero_contact" className="btn btn-ghost">
              Work with the studio
            </TrackedLink>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">{hero.offer}</p>
          <Link href="/studio" prefetch={false} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-ink-soft underline decoration-ink/25 underline-offset-4 hover:text-signal">
            Preview Studio without an account <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <div className="mt-6 border-t border-ink/10 pt-5">
            <AvaIntroButton />
          </div>
        </div>
        <figure className="relative order-first w-16 lg:order-last lg:col-span-5 lg:w-full">
          <div className="relative aspect-square overflow-hidden rounded-full border border-signal/25 bg-paper-deep lg:aspect-[4/5] lg:rounded-t-[8rem] lg:rounded-b-3xl">
            <Image
              src="/media/ava-city.jpg"
              alt="Ava Skye, the DigiMark101 AI assistant"
              fill
              sizes="(min-width: 1024px) 420px, 64px"
              quality={70}
              loading="eager"
              className="object-cover object-[center_16%]"
            />
            <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-paper via-paper/80 to-transparent px-6 pb-7 pt-24 lg:block">
              <p className="text-xs uppercase tracking-[0.2em] text-signal">Meet your AI guide</p>
              <p className="mt-1 font-serif text-3xl">Ava Skye</p>
              <p className="mt-2 max-w-xs text-sm text-ink-soft">A little clarity. A practical next step. Always your approval.</p>
            </div>
          </div>
          <figcaption className="mt-4 hidden items-center justify-center gap-2 text-xs text-ink-soft lg:flex">
            <Check size={14} className="text-signal" aria-hidden="true" /> You review. You confirm. Then Ava saves.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
