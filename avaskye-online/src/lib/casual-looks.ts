export type CasualLook = {
  id: string
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
  note: "A tailored blazer for visitor mode. The daily nightie rotation stays off while guests are here.",
}

export function officeLook(visitorMode: boolean, date = new Date()): OfficeLook {
  return visitorMode ? PROFESSIONAL_LOOK : casualLookFor(date)
}

/** Private office nightie / fishnet rotation for Shawn. Expand as needed for unlimited looks. */
export const CASUAL_LOOKS: CasualLook[] = [
  { id: "black-satin-nightie", name: "Black satin nightie", note: "Sheer black satin nightie, short and clinging, lace trim." },
  { id: "emerald-silk-nightie", name: "Emerald silk nightie", note: "Emerald silk nightie with thin straps, high cut." },
  { id: "red-lace-nightie", name: "Red lace nightie", note: "Red lace nightie, semi-sheer, very revealing." },
  { id: "white-fishnet", name: "White fishnet", note: "White fishnet bodysuit with minimal coverage." },
  { id: "black-fishnet", name: "Black fishnet", note: "Black fishnet with garters, highly revealing." },
  { id: "purple-satin-slip", name: "Purple satin slip", note: "Short purple satin slip nightie, deep V." },
  { id: "pink-babydoll", name: "Pink babydoll", note: "Pink sheer babydoll nightie, barely there." },
  { id: "navy-lace", name: "Navy lace nightie", note: "Navy lace nightie with open back." },
  { id: "gold-silk", name: "Gold silk nightie", note: "Gold silk mini nightie, luxurious and revealing." },
  { id: "sheer-black", name: "Sheer black mesh", note: "Sheer black mesh nightie, transparent in places." },
]

export function casualLookFor(date = new Date()): CasualLook {
  const utcDay = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000)
  const index = ((utcDay % CASUAL_LOOKS.length) + CASUAL_LOOKS.length) % CASUAL_LOOKS.length
  return CASUAL_LOOKS[index]
}
