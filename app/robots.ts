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
    //  - flux-mises-a-jour.xml : flux Atom des pages reellement modifiees, avec
    //    leurs vraies dates (01/09/2026). Google le relit bien plus souvent
    //    qu'un sitemap. A soumettre AUSSI dans GSC : un flux est un format
    //    distinct, ce n'est pas un sous-sitemap (exception a la regle du 29/04).
    sitemap: [
      `${BASE_URL}/sitemap-index.xml`,
      `${BASE_URL}/flux-mises-a-jour.xml`,
      "https://www.workwaveai.co/sitemap-ai-en.xml",
    ],
  };
}
