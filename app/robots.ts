import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/test", "/api/", "/pro/dashboard", "/pro/connexion", "/pro/reclamer", "/auth/callback"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
