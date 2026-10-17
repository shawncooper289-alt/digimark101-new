export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-signal/30 bg-mist px-4 py-3 text-sm leading-relaxed text-ink">
      <strong className="font-semibold">Placeholder. </strong>
      {children}
    </p>
  )
}
