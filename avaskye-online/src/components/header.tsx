import Link from "next/link";

export function Header({ cta = "Open studio", href = "/studio" }: { cta?: string; href?: string }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      <Link href="/" className="text-sm tracking-[0.18em] uppercase">Ava Skye</Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <a href="https://www.digimark101.com">Back to DigiMark101</a>
        <Link href="/pricing">Plans</Link>
        <Link href="/prompts">Prompts</Link>
        <Link href="/upgrade">Agency seats</Link>
        <Link href={href} className="rounded-full bg-accent px-4 py-2 text-accent-fg">{cta}</Link>
      </nav>
    </header>
  );
}
