export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede: string
}) {
  return (
    <header className="border-b border-ink/10">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{eyebrow}</p>
        <h1 className="display mt-4 max-w-4xl text-5xl md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{lede}</p>
      </div>
    </header>
  )
}
