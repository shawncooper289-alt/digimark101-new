import Link from "next/link"
import { StartActions } from "@/components/home/start-actions"
import {
  audiences,
  comparison,
  disciplinePlain,
  earningsDisclaimer,
  features,
  homeFaqs,
  howSteps,
  moneySteps,
  pageLinks,
  reasons,
} from "@/lib/home-content"
import { packages, services } from "@/lib/site"

const eyebrow = "home-kicker"
const title = "home-title"
const lede = "home-lede"
const wrap = "home-wrap"
const card = "home-card"

export function HomeSections() {
  const groups = [...new Set(features.map((feature) => feature.group))]

  return (
    <>
      <nav className="border-b border-ink/10" aria-label="On this page">
        <ul className="mx-auto flex max-w-6xl gap-x-6 gap-y-2 overflow-x-auto px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {pageLinks.map((link) => (
            <li key={link.href} className="shrink-0">
              <a href={link.href} className="inline-flex min-h-11 items-center text-sm text-ink-soft hover:text-signal">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="what" className="dm-rise scroll-mt-24 border-b border-ink/10" aria-labelledby="what-heading">
        <div className={wrap}>
          <p className={eyebrow}>The platform</p>
          <h2 id="what-heading" className={title}>
            One place for the marketing. A person who sets it up with you.
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="grid gap-4 text-base leading-relaxed text-ink-soft lg:col-span-7">
              <p>
                DigiMark101 is software and a studio. The software is Studio, the workspace where your marketing lives. The studio is the team and the method behind eight kinds of marketing work. Ava Skye sits between them. She is an AI assistant: she can talk, draft, and fill in forms. She saves a change only after you confirm it.
              </p>
              <p>
                All-in-one means those jobs share one login. Your people, the path of a sale, email drafts, page plans, social drafts, files, and reminders are in Studio. It also means the eight disciplines — search, paid ads, social, content, web design, email, analytics, and AI automation — are explained in the same place.
              </p>
              <p>
                You can use it if you are starting from zero. You can use it if you already have clients. The point is a system you own, with Ava growing it beside you, instead of a stack of tools you have to stitch together before you can sell anything.
              </p>
            </div>
            <aside className="lg:col-span-5">
              <div className="rounded-[1.6rem] border border-signal/30 bg-mist p-6">
                <p className={eyebrow}>Say it simply</p>
                <dl className="mt-5 grid gap-4 text-sm leading-relaxed">
                  <div>
                    <dt className="font-semibold text-ink">CRM</dt>
                    <dd className="text-ink-soft">Your contact list, with a memory of who each person is.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Funnel</dt>
                    <dd className="text-ink-soft">A page with one job, then a follow-up, then the offer.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Pipeline</dt>
                    <dd className="text-ink-soft">The path of a sale, from “just met” to “said yes.”</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="who" className="dm-rise scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="who-heading">
        <div className={wrap}>
          <p className={eyebrow}>Who it is for</p>
          <h2 id="who-heading" className={title}>
            Built for anyone who wants to make money online.
          </h2>
          <p className={lede}>
            The same platform holds a starting point for each of these. Ava adjusts the questions. She does not assume you already run an agency.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <li key={audience.name} className={card}>
                <h3 className="font-serif text-3xl tracking-tight">{audience.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{audience.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="dm-rise scroll-mt-24 relative overflow-hidden bg-pine" aria-labelledby="how-heading">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(203,176,130,0.16),transparent_55%)]" aria-hidden="true" />
        <div className={`relative ${wrap}`}>
          <p className={eyebrow}>How it works</p>
          <h2 id="how-heading" className={title}>
            Four steps. Then the system is yours.
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((step) => (
              <li key={step.index} className="border-t border-signal/40 pt-5">
                <p className="font-serif text-4xl text-signal">{step.index}</p>
                <h3 className="mt-4 font-serif text-2xl leading-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <StartActions compact />
          </div>
        </div>
      </section>

      <section id="why" className="dm-rise scroll-mt-24 relative overflow-hidden bg-pine" aria-labelledby="why-heading">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(203,176,130,0.14),transparent_50%)]" aria-hidden="true" />
        <div className={`relative ${wrap}`}>
          <p className={eyebrow}>Why DigiMark101 and Ava</p>
          <h2 id="why-heading" className={title}>
            The best choice is the system you can actually run.
          </h2>
          <p className={lede}>
            DigiMark101 is for people who want an all-in-one platform and a guide. Ava is that guide. The reasons below are capabilities you can check in the product, not borrowed awards.
          </p>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {reasons.map((reason, index) => (
              <li key={reason.title} className="border-t border-white/15 pt-5">
                <p className="font-serif text-2xl text-signal">0{index + 1}</p>
                <h3 className="mt-3 font-serif text-2xl">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{reason.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="earn" className="dm-rise scroll-mt-24 border-b border-ink/10" aria-labelledby="earn-heading">
        <div className={wrap}>
          <p className={eyebrow}>How you make money</p>
          <h2 id="earn-heading" className={title}>
            The work the platform helps you do.
          </h2>
          <p className={lede}>
            DigiMark101 helps you find people, follow up, and sell. It does not pay you, and it does not promise a number. Income depends on your offer, your effort, and the market.
          </p>
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {moneySteps.map((step, index) => (
              <li key={step.title} className={card}>
                <p className="font-serif text-2xl text-signal">0{index + 1}</p>
                <h3 className="mt-3 font-serif text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-ink-soft">{earningsDisclaimer}</p>
        </div>
      </section>

      <section id="features" className="dm-rise scroll-mt-24 border-b border-ink/10" aria-labelledby="features-heading">
        <div className={wrap}>
          <p className={eyebrow}>Everything inside</p>
          <h2 id="features-heading" className={title}>
            The full workspace, in plain language.
          </h2>
          <p className={lede}>
            Each block says what the feature is and what it does today. If a part is still being connected, the note says that. Open Studio any time to see the same sections with your own rows.
          </p>
          <div className="mt-12 grid gap-12">
            {groups.map((group) => (
              <div key={group}>
                <h3 className="font-serif text-2xl text-signal">{group}</h3>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {features
                    .filter((feature) => feature.group === group)
                    .map((feature) => (
                      <li key={feature.name} className={card}>
                        <h4 className="font-serif text-2xl tracking-tight">{feature.name}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.summary}</p>
                        <p className="mt-3 border-t border-ink/10 pt-3 text-sm leading-relaxed text-ink">{feature.today}</p>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-ink-soft">
            <Link href="/studio" className="font-semibold text-signal">
              Open Studio
            </Link>{" "}
            to walk the screens, or{" "}
            <Link href="/start" className="font-semibold text-signal">
              start the first campaign
            </Link>{" "}
            if you want Ava to draft one page, one form, and three emails for you to approve.
          </p>
        </div>
      </section>

      <section id="disciplines" className="dm-rise scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="disciplines-heading">
        <div className={wrap}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={eyebrow}>Eight disciplines</p>
              <h2 id="disciplines-heading" className={title}>
                The eight kinds of marketing work.
              </h2>
            </div>
            <Link href="/services" className="btn btn-ghost">
              All services
            </Link>
          </div>
          <p className={lede}>
            A discipline is one kind of marketing. You do not turn all eight on in a week. They are here so the system can be designed together, then used in an order you can keep.
          </p>
          <ol className="mt-10 grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="group flex h-full flex-col rounded-[1.4rem] border border-ink/10 bg-card/80 p-5 transition hover:border-signal/50"
                >
                  <span className="font-serif text-2xl text-signal">{service.index}</span>
                  <span className="mt-3 font-serif text-3xl tracking-tight group-hover:text-signal">{service.name}</span>
                  <span className="mt-2 text-sm leading-relaxed text-ink-soft">{disciplinePlain[service.slug] ?? service.summary}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="compare" className="dm-rise scroll-mt-24 border-b border-ink/10" aria-labelledby="compare-heading">
        <div className={wrap}>
          <p className={eyebrow}>Compare</p>
          <h2 id="compare-heading" className={title}>
            One workspace, or a pile of separate tools.
          </h2>
          <p className={lede}>
            This is a capability comparison. Prices are left out on purpose. Membership prices live on the pricing page. Agency work is quoted in a proposal.
          </p>
          <div className="mt-10 grid gap-3 md:hidden">
            {comparison.map((row) => (
              <article key={row.job} className={card}>
                <h3 className="font-serif text-2xl">{row.job}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">Separate tools. </span>
                  {row.stack}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  <span className="font-semibold text-signal">DigiMark101. </span>
                  {row.here}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-10 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">DigiMark101 compared with a typical stack of separate marketing tools, by capability</caption>
              <thead>
                <tr className="text-ink">
                  <th scope="col" className="border-b border-ink/15 px-4 py-3 font-semibold">
                    The job
                  </th>
                  <th scope="col" className="border-b border-ink/15 px-4 py-3 font-semibold">
                    Separate tools
                  </th>
                  <th scope="col" className="border-b border-ink/15 px-4 py-3 font-semibold text-signal">
                    DigiMark101
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.job}>
                    <th scope="row" className="border-b border-ink/10 px-4 py-4 align-top font-serif text-lg font-medium text-ink">
                      {row.job}
                    </th>
                    <td className="border-b border-ink/10 px-4 py-4 align-top leading-relaxed text-ink-soft">{row.stack}</td>
                    <td className="border-b border-ink/10 px-4 py-4 align-top leading-relaxed text-ink">{row.here}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="beta-home" className="dm-rise scroll-mt-24 border-b border-ink/10" aria-labelledby="beta-heading">
        <div className={wrap}>
          <div className="grid items-center gap-8 rounded-[1.8rem] border border-signal/40 bg-mist px-6 py-8 md:grid-cols-12 md:px-10 md:py-12">
            <div className="md:col-span-7">
              <p className={eyebrow}>Beta</p>
              <h2 id="beta-heading" className="display mt-3 text-4xl sm:text-5xl">
                Try the real workspace. The seat is free.
              </h2>
              <p className="mt-4 max-w-xl text-ink-soft">
                DigiMark101 is in beta. Request a tester seat with the email you check. We send a sign-in link. There is no PayPal step. Open Studio, let Ava set up one piece, and tell us what is missing. That note stays with the owner.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:col-span-5">
              <Link href="/beta" className="btn btn-signal w-full">
                Join the beta
              </Link>
              <Link href="/signup" className="btn btn-ghost w-full">
                Create your account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className="dm-rise scroll-mt-24 border-b border-ink/10 bg-paper-deep" aria-labelledby="plans-heading">
        <div className={wrap}>
          <p className={eyebrow}>Plans</p>
          <h2 id="plans-heading" className={title}>
            Use the platform yourself, or hire the studio.
          </h2>
          <p className={lede}>
            Field, Studio, and Partner are ways to hire DigiMark101. The fee is written in a proposal. Membership is the public plan, priced on the pricing page, and it renews until you cancel it in PayPal.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <article key={pkg.name} className={index === 1 ? "rounded-[1.5rem] border border-signal bg-mist p-6" : `${card}`}>
                <p className={eyebrow}>{pkg.eyebrow}</p>
                <h3 className="mt-3 font-serif text-4xl">{pkg.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{pkg.summary}</p>
                <p className="mt-4 text-sm font-semibold text-ink">{pkg.priceLabel}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {pkg.includes.map((item) => (
                    <li key={item} className="border-t border-ink/10 pt-2 text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing" className="btn btn-signal w-full sm:w-auto">
              See pricing
            </Link>
            <Link href="/contact" className="btn btn-ghost w-full sm:w-auto">
              Write to the studio
            </Link>
          </div>
          <p className="mt-10 text-sm text-ink-soft">
            <Link href="/blog" className="font-semibold text-signal">
              Read the journal
            </Link>{" "}
            for how the studio thinks about the work. Those notes are methods, not client results.
          </p>
        </div>
      </section>

      <section id="faq" className="dm-rise scroll-mt-24" aria-labelledby="faq-heading">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-4">
            <p className={eyebrow}>Questions</p>
            <h2 id="faq-heading" className="display mt-3 text-4xl sm:text-5xl">
              Plain answers before you start.
            </h2>
            <div className="mt-8">
              <StartActions compact />
            </div>
          </div>
          <div className="md:col-span-8">
            {homeFaqs.map((faq) => (
              <details key={faq.question} className="faq border-t border-ink/10 py-4">
                <summary className="flex min-h-11 items-center justify-between gap-4 text-lg font-medium">
                  {faq.question}
                  <span aria-hidden="true" className="text-signal">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-pine" aria-labelledby="close-heading">
        <div className={`${wrap} text-center`}>
          <p className={eyebrow}>Start</p>
          <h2 id="close-heading" className="display mx-auto mt-3 max-w-3xl text-4xl sm:text-6xl">
            Build your own dynasty. Own the system. Grow it with Ava.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-ink-soft">
            Create an account, talk to Ava, or take a free beta seat. Bring one offer. Leave with a workspace you can keep.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch sm:max-w-none sm:items-center">
            <StartActions />
          </div>
        </div>
      </section>
    </>
  )
}
