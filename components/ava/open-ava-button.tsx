"use client"

type OpenAvaButtonProps = {
  children: React.ReactNode
  className?: string
}

export function OpenAvaButton({ children, className }: OpenAvaButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("ava:open"))}
    >
      {children}
    </button>
  )
}
