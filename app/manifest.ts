
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TAUI TE ORA",
    short_name: "TAUI",
    description:
      "Plateforme d'adoption et de protection animale en Polynésie française.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4EEE3",
    theme_color: "#F4EEE3",
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
    ],
  };
}
