export type HubProduct = {
  key: string
  name: string
  house: "DigiMark101" | "Ava Skye"
  summary: string
  opens: { href: string; label: string }[]
}

/** Add a later product here. Campaigns and records stay separated by key. */
export const HUB_PRODUCTS: HubProduct[] = [
  {
    key: "digimark101",
    name: "DigiMark101",
    house: "DigiMark101",
    summary: "The client studio. Campaigns, free social plays, media, and the public site run from this office.",
    opens: [
      { href: "/campaigns?product=digimark101", label: "Campaigns" },
      { href: "/social", label: "Social" },
      { href: "/media", label: "Media" },
      { href: "/records?product=digimark101", label: "Records" },
      { href: "https://www.digimark101.com/studio", label: "Studio" },
    ],
  },
]

export function isHubProduct(key: string) {
  return HUB_PRODUCTS.some((product) => product.key === key)
}

export function hubProduct(key: string | null | undefined) {
  return HUB_PRODUCTS.find((product) => product.key === key) ?? HUB_PRODUCTS[0]
}
