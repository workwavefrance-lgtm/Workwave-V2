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
    ];
  },
};

export default nextConfig;
