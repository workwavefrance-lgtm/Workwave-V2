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
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
