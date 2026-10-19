import Link from "next/link"
import { HUB_PRODUCTS } from "@/lib/products"

export default function ProductsPage() {
  return (
    <section>
      <h1 className="text-5xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>Hub</h1>
      <p className="mt-3 max-w-2xl text-muted">
        This office holds every Ava Skye and DigiMark101 product. DigiMark101 is the one that is live. A later product is added to the list, then it gets its own campaigns and records. It does not appear here until it has a name.
      </p>
      <ul className="mt-8 grid gap-4">
        {HUB_PRODUCTS.map((product) => (
          <li key={product.key} className="rounded-3xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{product.house} · live</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-display-loaded), serif" }}>{product.name}</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">{product.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.opens.map((item) =>
                item.href.startsWith("http") ? (
                  <a key={item.href} className="rounded-full bg-accent px-4 py-2 text-sm text-accent-fg" href={item.href}>{item.label}</a>
                ) : (
                  <Link key={item.href} className="rounded-full border border-border px-4 py-2 text-sm" href={item.href}>{item.label}</Link>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
