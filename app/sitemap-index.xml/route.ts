/**
 * Sitemap index : 1 seul URL a soumettre a Google qui pointe vers les 10
 * sub-sitemaps generes par app/sitemap.ts (via generateSitemaps).
 *
 * Soumettre dans Google Search Console : https://workwave.fr/sitemap-index.xml
 */
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";

// Doit matcher PROS_PER_SITEMAP et SITEMAP_PROS_OFFSET dans app/sitemap.ts
const PROS_PER_SITEMAP = 45000;
const SITEMAP_PROS_OFFSET = 100;
const FIXED_SITEMAP_IDS = [0, 1, 2, 3];

export const revalidate = 3600; // 1h

export async function GET() {
  const supabase = getAdminServiceClient();
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  const proSitemapsCount = Math.ceil((count || 0) / PROS_PER_SITEMAP);
  const allIds = [
    ...FIXED_SITEMAP_IDS,
    ...Array.from(
      { length: proSitemapsCount },
      (_, i) => SITEMAP_PROS_OFFSET + i
    ),
  ];

  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allIds
  .map(
    (id) =>
      `  <sitemap><loc>${BASE_URL}/sitemap/${id}.xml</loc><lastmod>${now}</lastmod></sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
