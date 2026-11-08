import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Charlotte's GemBook — Magical Bedtime Stories",
    short_name: "GemBook",
    description:
      "A magical landscape bedtime picture book & voiceover reader for Charlotte.",
    start_url: "/?autoplay=true",
    display: "fullscreen",
    orientation: "any",
    background_color: "#090b16",
    theme_color: "#090b16",
    categories: ["books", "kids", "education", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/app-icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
