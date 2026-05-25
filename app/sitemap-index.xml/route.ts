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
const SITEMAP_AI_PROS_OFFSET = 200;
const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];
// IDs fixes (cf. app/sitemap.ts) :
//   0 static · 1 cat x dept · 2 cat x ville · 3 specialites · 4 Workwave AI
const FIXED_SITEMAP_IDS = [0, 1, 2, 3, 4];

export const revalidate = 86400; // 24h. L'index ne change que quand le
// nombre total de pros depasse un multiple de 45000, donc 24h est large.

export async function GET() {
  const supabase = getAdminServiceClient();
  // count: "estimated" (lit pg_class stats) au lieu de "exact" qui scanne
  // toute la table (226k rows, ~3-5s, cause des timeouts Googlebot).
  // Cf. lecon apprise CLAUDE.md du 2026-04-28.
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  // Count pros tech (categories 43-48) pour les sub-sitemaps AI 200+
  const { count: techCount } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null);

  const proSitemapsCount = Math.ceil((count || 0) / PROS_PER_SITEMAP);
  const aiProSitemapsCount = Math.ceil((techCount || 0) / PROS_PER_SITEMAP);
  const allIds = [
    ...FIXED_SITEMAP_IDS,
    ...Array.from(
      { length: proSitemapsCount },
      (_, i) => SITEMAP_PROS_OFFSET + i
    ),
    ...Array.from(
      { length: aiProSitemapsCount },
      (_, i) => SITEMAP_AI_PROS_OFFSET + i
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
