import { AvaOutsideStudio } from "@/components/ava/ava-outside-studio"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex-1">
      {children}
      <AvaOutsideStudio />
    </main>
  )
}
