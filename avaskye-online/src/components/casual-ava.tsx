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

function Nightie({ color = "#1a1a1a", sheer = false }: { color?: string; sheer?: boolean }) {
  return (
    <>
      <path d="M22 48c8-6 28-6 36 0l2 22H20z" fill={color} opacity={sheer ? 0.7 : 1} />
      <path d="M30 46c4 8 16 8 20 0" fill="none" stroke={color} strokeWidth="2" />
      <path d="M28 50h24" stroke="#fff" strokeWidth="0.8" opacity="0.4" />
    </>
  );
}

function Fishnet() {
  return (
    <>
      <path d="M20 46h40v28H20z" fill="none" stroke="#333" strokeWidth="0.8" />
      <path d="M24 48h32M24 52h32M24 56h32M24 60h32M24 64h32" stroke="#555" strokeWidth="0.5" />
      <path d="M22 48v26M26 48v26M30 48v26M34 48v26M38 48v26M42 48v26M46 48v26M50 48v26M54 48v26M58 48v26" stroke="#555" strokeWidth="0.5" />
    </>
  );
}

export function CasualAva({ look = casualLookFor(), className = "", reacting = false }: { look?: OfficeLook; className?: string; reacting?: boolean }) {
  const caption = look.id === "professional" ? `Visitor mode: ${look.name}. ${look.note}` : `Today’s look: ${look.name}. ${look.note}`;
  const isFishnet = look.id.includes("fishnet") || look.id.includes("mesh");
  return (
    <figure className={`${className} ${reacting ? "animate-pulse" : ""}`}>
      <svg viewBox="0 0 80 80" className="h-40 w-40" role="img" aria-label={`Ava Skye in a ${look.name.toLowerCase()}`}>
        <circle cx="40" cy="40" r="38" fill="#1c1a18" />
        {isFishnet ? <Fishnet /> : <Nightie color={look.id.includes("emerald") ? "#0d5c4d" : look.id.includes("red") ? "#8b1a1a" : look.id.includes("pink") ? "#e75480" : look.id.includes("purple") ? "#6a0dad" : look.id.includes("gold") ? "#c9a227" : "#1a1a1a"} sheer={look.id.includes("sheer") || look.id.includes("lace")} />}
        <Face />
      </svg>
      <figcaption className="mt-3 max-w-xs text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
