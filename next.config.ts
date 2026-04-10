import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
