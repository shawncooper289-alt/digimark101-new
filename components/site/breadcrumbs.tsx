import Link from "next/link"

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-ink/10">
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-5 py-3 text-sm text-ink-soft">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={item.path} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {last ? (
                <span aria-current="page" className="text-ink">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="underline decoration-ink/30 underline-offset-4 hover:text-signal">
                  {item.name}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
