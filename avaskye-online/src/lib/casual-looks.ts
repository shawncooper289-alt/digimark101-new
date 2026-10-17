export type CasualLook = {
  id: "knit" | "tee" | "sweater" | "hoodie"
  name: string
  note: string
}

export type OfficeLook = CasualLook | {
  id: "professional"
  name: string
  note: string
}

export const PROFESSIONAL_LOOK: OfficeLook = {
  id: "professional",
  name: "Professional",
  note: "A tailored blazer for visitor mode. The daily casual rotation stays off while guests are here.",
}

export function officeLook(visitorMode: boolean, date = new Date()): OfficeLook {
  return visitorMode ? PROFESSIONAL_LOOK : casualLookFor(date)
}

/** Swap or reorder this list to change the office rotation. The public sites do not use it. */
export const CASUAL_LOOKS: CasualLook[] = [
  { id: "knit", name: "Cozy knit", note: "A relaxed cream knit with the sleeves pushed up." },
  { id: "tee", name: "Tee and joggers", note: "A fitted tee with heather joggers." },
  { id: "sweater", name: "Off-shoulder sweater", note: "A soft sweater sitting on one shoulder, still fully covered." },
  { id: "hoodie", name: "Soft hoodie", note: "An easy hoodie with the hood down." },
]

export function casualLookFor(date = new Date()): CasualLook {
  const utcDay = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000)
  const index = ((utcDay % CASUAL_LOOKS.length) + CASUAL_LOOKS.length) % CASUAL_LOOKS.length
  return CASUAL_LOOKS[index]
}
