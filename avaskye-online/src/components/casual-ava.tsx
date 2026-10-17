import { casualLookFor, type OfficeLook } from "@/lib/casual-looks";

const skin = "#e6c2a6";
const hair = "#2a211c";
const ink = "#1c1614";

function Face() {
  return (
    <>
      <path d="M28 18c2-8 22-8 24 0 2 10-2 18-12 18S26 28 28 18z" fill={hair} />
      <ellipse cx="40" cy="34" rx="12" ry="13" fill={skin} />
      <path d="M30 30h6M44 30h6" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M34 40c2.2 2 9.8 2 12 0" fill="none" stroke="#a85b78" strokeWidth="1.4" strokeLinecap="round" />
    </>
  );
}

function Knit() {
  return (
    <>
      <path d="M18 58c4-12 12-16 22-16s18 4 22 16v10H18z" fill="#f3efe6" />
      <path d="M22 52h36M24 56h32M26 60h28" stroke="#e4ddd0" strokeWidth="1.2" />
      <path d="M30 44c2 4 18 4 20 0" fill="none" stroke="#d9d0c2" strokeWidth="2" />
    </>
  );
}

function Tee() {
  return (
    <>
      <path d="M22 50c6-8 30-8 36 0l4 8H18z" fill="#3d4654" />
      <path d="M18 70h18c0-6 8-8 4-14h-8c-6 4-14 6-14 14z" fill="#b7b1a8" />
      <path d="M44 56h18c0 8-8 10-14 14H44c-4-6 4-8 0-14z" fill="#b7b1a8" />
    </>
  );
}

function Sweater() {
  return (
    <>
      <path d="M16 62c6-16 14-18 20-16 8 2 16 0 24 8 4 4 6 10 4 16H16z" fill="#c9b3c4" />
      <path d="M24 46c6 2 10 1 14-2" fill="none" stroke={skin} strokeWidth="4" strokeLinecap="round" />
      <path d="M36 48c8 4 18 2 24 8" fill="none" stroke="#c9b3c4" strokeWidth="6" strokeLinecap="round" />
    </>
  );
}

function Blazer() {
  return (
    <>
      <path d="M16 56h48l2 16H14z" fill="#243044" />
      <path d="M30 56l10 16 10-16" fill="#1b2636" />
      <path d="M34 50h12v8H34z" fill="#f4efe6" />
      <path d="M38 50h4v12h-4z" fill="#243044" />
    </>
  );
}

function Hoodie() {
  return (
    <>
      <path d="M20 48c4-8 36-8 40 0 2 8-2 22-8 22H28c-8 0-10-14-8-22z" fill="#8fa396" />
      <path d="M28 42c4-6 20-6 24 0 0 6-4 8-12 8s-12-2-12-8z" fill="#7d917f" />
      <path d="M36 58v10M44 58v10" stroke="#f3efe8" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M30 66h20v6H30z" fill="#7d917f" />
    </>
  );
}

const outfits = {
  knit: Knit,
  tee: Tee,
  sweater: Sweater,
  hoodie: Hoodie,
  professional: Blazer,
};

export function CasualAva({ look = casualLookFor(), className = "" }: { look?: OfficeLook; className?: string }) {
  const Outfit = outfits[look.id];
  const caption = look.id === "professional" ? `Visitor mode: ${look.name}. ${look.note}` : `Today’s look: ${look.name}. ${look.note}`;
  return (
    <figure className={className}>
      <svg viewBox="0 0 80 80" className="h-40 w-40" role="img" aria-label={`Ava Skye in a ${look.name.toLowerCase()}`}>
        <circle cx="40" cy="40" r="38" fill="#1c1a18" />
        <Outfit />
        <Face />
      </svg>
      <figcaption className="mt-3 max-w-xs text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
