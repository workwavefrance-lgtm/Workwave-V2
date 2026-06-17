import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les sous-sitemaps (1.78M pros, 369k pages cat×ville) peuvent dépasser le
  // timeout par défaut de 60s/page statique au build (surtout en local :
  // latence machine→Supabase × nombreux round-trips). 180s laisse la marge
  // sans masquer un vrai problème. Vercel build largement sous cette limite.
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eifypjlyzgfpunxrouwo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Logos issus de l'enrichissement Google Places (sinon next/image jette
      // un 500 a la regeneration ISR des fiches concernees — bug 11/06).
      {
        protocol: "https",
        hostname: "places.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      // ─── Workwave AI EN PAUSE (16/06/2026) ────────────────────────────────
      // Décision Willy : on met TOUTE la partie AI internationale en sommeil.
      // workwaveai.co (+ .io / .ai) redirige désormais 301 vers workwave.fr
      // (BTP). Le code AI reste dans le repo (route groups (ai-en)/(ai)) mais
      // n'est plus servi publiquement sur .co. Objectifs : (1) tuer le duplicate
      // content — .co servait/indexait les pages BTP (requêtes "plan de travail
      // céramique", "débroussaillage"… apparaissaient sur .co) ; (2) consolider
      // tout le jus SEO sur le BTP ; (3) 100 % réversible (retirer ces règles
      // = relancer l'AI). IMPORTANT : les règles /en/ai passent AVANT le
      // catch-all .co (l'ordre détermine la 1ʳᵉ match).
      //
      // 1. .co : contenu EN (/en/ai/*) en pause -> home BTP (1 hop, pas de boucle).
      {
        source: "/en/ai",
        has: [{ type: "host", value: "(www\\.)?workwaveai\\.co" }],
        destination: "https://workwave.fr/",
        permanent: true,
      },
      {
        source: "/en/ai/:path*",
        has: [{ type: "host", value: "(www\\.)?workwaveai\\.co" }],
        destination: "https://workwave.fr/",
        permanent: true,
      },
      // 2. .co : tout le reste (dont les pages BTP qui avaient fuité) -> même
      //    chemin sur .fr (consolide le duplicate vers le canonical BTP).
      {
        source: "/:path*",
        has: [{ type: "host", value: "(www\\.)?workwaveai\\.co" }],
        destination: "https://workwave.fr/:path*",
        permanent: true,
      },
      // 3. Vanity .io / .ai -> home BTP.
      {
        source: "/:path*",
        has: [{ type: "host", value: "workwaveai\\.io" }],
        destination: "https://workwave.fr/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "workwave\\.ai" }],
        destination: "https://workwave.fr/",
        permanent: true,
      },
      // 4. workwave.fr/en/ai/* (servi par le route group (ai-en)) -> home BTP.
      //    Pause le contenu EN aussi côté .fr ET évite la boucle avec la règle 1.
      {
        source: "/en/ai",
        has: [{ type: "host", value: "workwave\\.fr" }],
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/ai/:path*",
        has: [{ type: "host", value: "workwave\\.fr" }],
        destination: "/",
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
      // promenade-animaux : redirect 301 RETIRÉ le 2026-06-03 — catégorie
      // re-créée en proximité (inscription spontanée, Vague 3 AlloVoisins).
      // lavage-voiture-a-domicile droppé (faux positifs massifs sur NAF 4520A)
      { source: "/lavage-voiture-a-domicile", destination: "/", permanent: true },
      { source: "/lavage-voiture-a-domicile/:path*", destination: "/", permanent: true },
      // cheministe droppé (NAF 4322B = 95% faux positifs sur "BOIS" = nom de famille)
      { source: "/cheministe", destination: "/chauffagiste", permanent: true },
      { source: "/cheministe/:path*", destination: "/chauffagiste/:path*", permanent: true },
      // ── Phase 4 BTP : articles blog "prix" (localisés Vienne) -> guides des
      // prix NATIONAUX (301, anti-cannibalisation). Mapping hand-curé : cas
      // exact -> guide prestation ; sinon -> guide métier (toujours pertinent).
      // 3 articles énergie/DPE gardés (pas d'équivalent national). 2026-06-05.
      { source: "/blog/chaudiere-a-granules-a-la-rochelle-prix-maprimerenov-et-installation-2026", destination: "/guide-des-prix/prix-chaudiere-a-granules", permanent: true },
      { source: "/blog/isolation-des-combles-a-niort-tarifs-et-aides-financieres-en-2026", destination: "/guide-des-prix/prix-isolation-combles", permanent: true },
      { source: "/blog/isolation-thermique-a-perigueux-prix-au-m-et-aides-2026", destination: "/guide-des-prix/prix-isolation-combles", permanent: true },
      { source: "/blog/pompe-a-chaleur-a-pau-prix-aides-et-installateurs-rge-2026", destination: "/chauffagiste/prix", permanent: true },
      { source: "/blog/prix-au-m2-placoplatre-en-2026-pose-fourniture-fourchettes-completes-en-vienne-86", destination: "/guide-des-prix/prix-doublage-placo-m2", permanent: true },
      { source: "/blog/prix-construction-piscine-en-vienne-86-en-2026-coque-beton-monobloc-guide-complet", destination: "/pisciniste/prix", permanent: true },
      { source: "/blog/prix-creation-terrasse-bois-2026-tarif-au-m-en-vienne-86-bois-exotique-vs-composite", destination: "/guide-des-prix/prix-pose-terrasse-bois", permanent: true },
      { source: "/blog/prix-cuisine-sur-mesure-2026-cout-fourchettes-et-conseils-pour-economiser-en-vienne-86", destination: "/guide-des-prix/prix-cuisine", permanent: true },
      { source: "/blog/prix-debouchage-canalisation-2026-tarif-urgence-et-intervention-plombier-en-vienne", destination: "/guide-des-prix/prix-debouchage-canalisation-bouchee", permanent: true },
      { source: "/blog/prix-installation-alarme-et-videosurveillance-maison-2026-guide-complet-des-tarifs-en-vienne", destination: "/guide-des-prix/prix-installation-systeme-alarme", permanent: true },
      { source: "/blog/prix-isolation-exterieure-ite-en-2026-cout-au-m-et-aides-financieres-en-vienne", destination: "/facadier/prix", permanent: true },
      { source: "/blog/prix-nettoyage-bureaux-2026-en-vienne-86-tarifs-au-m-forfaits-mensuels-et-devis-detailles", destination: "/guide-des-prix/prix-service-nettoyage", permanent: true },
      { source: "/blog/prix-peinture-interieure-au-m-en-2026-tarifs-devis-types-et-astuces-en-vienne-86", destination: "/guide-des-prix/prix-pose-peinture", permanent: true },
      { source: "/blog/prix-poele-a-granules-en-2026-installation-maprimerenov-et-economies-d-energie", destination: "/guide-des-prix/prix-dinstallation-poele-a-granules", permanent: true },
      { source: "/blog/prix-pose-carrelage-au-m2-en-2026-sol-mur-salle-de-bain-toutes-fourchettes", destination: "/guide-des-prix/prix-pose-carrelage", permanent: true },
      { source: "/blog/prix-pose-porte-d-entree-2026-pvc-alu-bois-fourchettes-completes-dans-la-vienne", destination: "/menuisier/prix", permanent: true },
      { source: "/blog/prix-ramonage-cheminee-2026-tarifs-obligations-legales-et-astuces-en-vienne-86", destination: "/guide-des-prix/prix-ramonage-cheminee", permanent: true },
      { source: "/blog/prix-vitrier-urgence-2026-remplacement-vitre-cassee-devis-et-tarifs-en-vienne-86", destination: "/vitrier/prix", permanent: true },
      { source: "/blog/tarif-horaire-electricien-en-2026-prix-moyen-deplacement-et-facturation-en-vienne-86", destination: "/electricien/prix", permanent: true },
    ];
  },
};

export default nextConfig;
