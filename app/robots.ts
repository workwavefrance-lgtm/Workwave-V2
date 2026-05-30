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
    // Deux sitemaps declares :
    //  - sitemap-index.xml : contenu FR/BTP (workwave.fr) -> a soumettre dans
    //    la propriete GSC workwave.fr.
    //  - sitemap-ai-en.xml : contenu EN international (workwaveai.co) -> a
    //    soumettre dans la propriete GSC workwaveai.co. Sitemap dedie et stable
    //    (cf. app/sitemap-ai-en.xml/route.ts), hors de l'index .fr.
    sitemap: [
      `${BASE_URL}/sitemap-index.xml`,
      "https://www.workwaveai.co/sitemap-ai-en.xml",
    ],
  };
}
