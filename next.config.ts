import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eifypjlyzgfpunxrouwo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      // ─── Workwave AI (workwaveai.co + .ai + .io) → workwave.fr/ai ────────
      // Phase 10 : si l'utilisateur achete un domaine vanity pour le vertical
      // tech (ex. workwaveai.co), tout traffic est redirige 301 vers le
      // sous-chemin /ai du domaine principal. Ca preserve le link juice et
      // garde 1 seul domaine indexable pour le SEO.
      //
      // Requiert : domaine ajoute en "redirect domain" dans Vercel project
      // settings + DNS configure vers Vercel.
      //
      // Pattern `has: [{ type: 'host', value: 'workwaveai.co' }]` matche
      // le header Host de la requete. Le destination utilise :path* pour
      // preserver l'eventuel sub-path.
      // ─── Workwave AI international : workwaveai.co SERT le contenu EN ──────
      // Le .co (gTLD) heberge le contenu anglais international (/en/ai/*). Un
      // gTLD ranke a l'international, contrairement au .fr (geo-cible France).
      // Le contenu BTP/FR servi aussi sur .co garde son canonical sur .fr
      // (metadataBase=workwave.fr) => pas de duplicate. Seules les pages EN
      // ont leur canonical sur .co (cf. lib/i18n/alternates.ts).
      //
      // 1. workwave.fr/en/ai/* -> 301 vers www.workwaveai.co/en/ai/* (consolide).
      {
        source: "/en/ai",
        has: [{ type: "host", value: "workwave.fr" }],
        destination: "https://www.workwaveai.co/en/ai",
        permanent: true,
      },
      {
        source: "/en/ai/:path*",
        has: [{ type: "host", value: "workwave.fr" }],
        destination: "https://www.workwaveai.co/en/ai/:path*",
        permanent: true,
      },
      // 2. www.workwaveai.co/ -> /en/ai : la racine du .co = home AI EN.
      {
        source: "/",
        has: [{ type: "host", value: "www.workwaveai.co" }],
        destination: "/en/ai",
        permanent: true,
      },
      // 3. Vanity .io / .ai (inactifs) -> home EN du .co.
      {
        source: "/:path*",
        has: [{ type: "host", value: "workwaveai.io" }],
        destination: "https://www.workwaveai.co/en/ai",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "workwave.ai" }],
        destination: "https://www.workwaveai.co/en/ai",
        permanent: true,
      },

      // /sitemap.xml -> /sitemap-index.xml : Next sert le sitemap a
      // /sitemap-index.xml (generateSitemaps dans app/sitemap.ts).
      // Ce redirect permet aux crawlers et outils tiers qui cherchent
      // l'URL conventionnelle /sitemap.xml de trouver le bon fichier.
      { source: "/sitemap.xml", destination: "/sitemap-index.xml", permanent: true },
      { source: "/nos-artisans", destination: "/recherche", permanent: true },
      { source: "/nos-artisans/:path*", destination: "/recherche", permanent: true },
      { source: "/fiche-artisan", destination: "/recherche", permanent: true },
      { source: "/fiche-artisan/:slug", destination: "/artisan/:slug", permanent: true },
      { source: "/poster-un-projet", destination: "/deposer-projet", permanent: true },
      { source: "/mon-compte", destination: "/pro/connexion", permanent: true },
      { source: "/dashboard", destination: "/pro/dashboard", permanent: true },
      { source: "/dashboard/:path*", destination: "/pro/dashboard/:path*", permanent: true },
      { source: "/pourquoi-devenir-workeur", destination: "/pro", permanent: true },
      { source: "/pourquoi-faire-appel-a-nos-workeurs", destination: "/", permanent: true },
      { source: "/tarifs", destination: "/pro", permanent: true },
      { source: "/produit/:path*", destination: "/pro", permanent: true },
      { source: "/project", destination: "/deposer-projet", permanent: true },
      { source: "/project/:path*", destination: "/deposer-projet", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
      { source: "/testtt", destination: "/", permanent: true },
      // Catégories supprimées (mini-sprint cleanup 2026-04-18)
      // jardinage absorbé par paysagiste (NAF 8130Z partagé)
      { source: "/jardinage", destination: "/paysagiste", permanent: true },
      { source: "/jardinage/:path*", destination: "/paysagiste/:path*", permanent: true },
      // promenade-animaux consolidé sur garde-animaux (NAF 9609Z partagé)
      { source: "/promenade-animaux", destination: "/garde-animaux", permanent: true },
      { source: "/promenade-animaux/:path*", destination: "/garde-animaux/:path*", permanent: true },
      // lavage-voiture-a-domicile droppé (faux positifs massifs sur NAF 4520A)
      { source: "/lavage-voiture-a-domicile", destination: "/", permanent: true },
      { source: "/lavage-voiture-a-domicile/:path*", destination: "/", permanent: true },
      // cheministe droppé (NAF 4322B = 95% faux positifs sur "BOIS" = nom de famille)
      { source: "/cheministe", destination: "/chauffagiste", permanent: true },
      { source: "/cheministe/:path*", destination: "/chauffagiste/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
