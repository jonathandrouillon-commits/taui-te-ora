import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Taui Te Ora",
    short_name: "Taui Te Ora",
    description:
      "Plateforme d'adoption et de protection animale en Polynésie française.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf7",
    theme_color: "#ef8196",
    orientation: "portrait",
    lang: "fr",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}