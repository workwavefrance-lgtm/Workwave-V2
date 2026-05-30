import type { MetadataRoute } from "next";

// Manifest PWA (auto-lié par Next.js via la convention app/manifest.ts).
// Les icônes pointent sur les fichiers générés (app/icon.png, app/apple-icon.png).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workwave — Trouvez un professionnel de confiance",
    short_name: "Workwave",
    description:
      "Annuaire et mise en relation avec des professionnels de confiance : BTP, services à domicile, freelances tech.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#FF5A36",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
