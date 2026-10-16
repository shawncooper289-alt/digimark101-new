import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DigiMark101",
    short_name: "DigiMark101",
    description: "A digital marketing studio for search, media, content, sites, email, analytics, and AI automation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1fb",
    theme_color: "#f6f1fb",
    lang: "en",
  }
}
