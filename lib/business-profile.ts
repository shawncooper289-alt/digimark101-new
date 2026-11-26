/**
 * Public business facts for the contact path and JSON-LD.
 * Leave a field blank until it is real. Never invent a phone, street, or profile URL.
 */

export const businessProfile = {
  areaServed: "United States",
  /**
   * TODO(owner): optional. DigiMark101 serves clients online across the US.
   * Fill these only if you later publish a real location. A blank address
   * stays out of the structured data so we do not imply a storefront.
   */
  address: {
    streetAddress: "",
    addressLocality: "",
    addressRegion: "",
    postalCode: "",
    addressCountry: "US",
  },
  /**
   * TODO(owner): a phone number you actually answer, in a form people can dial.
   * Example shape: +1-202-555-0100. Leave "" until then.
   */
  phone: "",
  /**
   * TODO(owner): https profile URLs you control (LinkedIn, YouTube, Google
   * Business Profile, Clutch, and so on). Leave the list empty until they exist.
   * The same list can also be set with ORGANIZATION_SAME_AS (comma-separated
   * https URLs). Do not invent a URL in either place.
   */
  sameAs: [] as string[],
}

export function dialablePhone(value = businessProfile.phone) {
  const trimmed = value.trim()
  if (!/^\+?[0-9().\-\s]{7,20}$/.test(trimmed)) return null
  const href = trimmed.replace(/[^\d+]/g, "")
  if (href.replace(/\D/g, "").length < 7) return null
  return { label: trimmed, href: `tel:${href}` }
}

export function publicSameAs(urls = businessProfile.sameAs) {
  return urls.filter((url) => {
    try {
      return new URL(url).protocol === "https:"
    } catch {
      return false
    }
  })
}

export function publicPostalAddress() {
  const address = businessProfile.address
  if (!address.streetAddress.trim() || !address.addressLocality.trim()) return null
  return {
    "@type": "PostalAddress" as const,
    streetAddress: address.streetAddress.trim(),
    addressLocality: address.addressLocality.trim(),
    addressRegion: address.addressRegion.trim(),
    postalCode: address.postalCode.trim(),
    addressCountry: address.addressCountry.trim() || "US",
  }
}
