import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/pro/dashboard/",
        "/pro/connexion",
        "/pro/mot-de-passe-oublie",
        "/pro/reclamer/",
        "/auth/",
        "/test",
        "/artisan/*/supprimer",
      ],
    },
    // sitemap-index.xml liste les 10 sub-sitemaps generes par app/sitemap.ts.
    // Une seule URL a soumettre dans Google Search Console.
    sitemap: `${BASE_URL}/sitemap-index.xml`,
  };
}
