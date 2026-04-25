import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";
import { getAdminServiceClient } from "@/lib/admin/service-client";

// Doit matcher PROS_PER_SITEMAP et SITEMAP_PROS_OFFSET dans app/sitemap.ts
const PROS_PER_SITEMAP = 45000;
const SITEMAP_PROS_OFFSET = 100;
// Les 4 premiers IDs sont fixes (static, cat-dept, cat-city, specialty)
const FIXED_SITEMAP_IDS = [0, 1, 2, 3];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const supabase = getAdminServiceClient();
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  const proSitemapsCount = Math.ceil((count || 0) / PROS_PER_SITEMAP);
  const allIds = [
    ...FIXED_SITEMAP_IDS,
    ...Array.from({ length: proSitemapsCount }, (_, i) => SITEMAP_PROS_OFFSET + i),
  ];

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
    sitemap: allIds.map((id) => `${BASE_URL}/sitemap/${id}.xml`),
  };
}
