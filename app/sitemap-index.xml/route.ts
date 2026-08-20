/**
 * Sitemap index : la SEULE adresse a soumettre a Google. Elle pointe vers les
 * sous-sitemaps produits par app/sitemap.ts (generateSitemaps).
 *
 * A soumettre dans Search Console : https://workwave.fr/sitemap-index.xml
 * Ne JAMAIS soumettre un sous-sitemap individuellement (lecon du 29/04/2026).
 */
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";

// Doit matcher PROS_PER_SITEMAP et SITEMAP_PROS_OFFSET dans app/sitemap.ts
const PROS_PER_SITEMAP = 45000;
const SITEMAP_PROS_OFFSET = 100;
const SITEMAP_AI_PROS_OFFSET = 200;
import { AI_CATEGORY_IDS as AI_CATEGORY_IDS_HELPER } from "@/lib/ai/helpers";
const AI_CATEGORY_IDS = AI_CATEGORY_IDS_HELPER as unknown as number[];
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
  // Count pros NON-tech (BTP) pour sub-sitemaps 100+. Les pros tech sont
  // dans sub-sitemaps 200+ uniquement (URL canonique /ai/freelance/[slug]),
  // pas dans le sub-sitemap pros standard.
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`);

  // Count pros tech (categories 43-48) pour les sub-sitemaps AI 200+
  const { count: techCount } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null);

  // MARGE DE SECURITE (20/08/2026). Le comptage "estimated" lit les
  // statistiques de pg_class, qui derivent apres toute grosse suppression :
  // depuis la deduplication des 121 197 doublons, il sous-estimait le BTP de
  // 61 687 lignes. Un seul sous-sitemap manquant a l'appel, et 45 000 fiches
  // deviennent invisibles de Google. Mesure du jour : /sitemap/142.xml servait
  // 41 158 adresses reelles et /sitemap/211.xml 13 812, sans etre declares,
  // soit 54 970 fiches hors sitemap.
  //
  // La marge ne coute rien : un sous-sitemap au-dela des donnees repond 200
  // avec zero adresse (verifie sur /sitemap/143.xml et /sitemap/212.xml), ce
  // qui est inoffensif. L'asymetrie est totale : un fichier vide en trop ne
  // fait rien, un fichier manquant coute 45 000 pages.
  const avecMarge = (n: number | null) =>
    n && n > 0 ? Math.ceil((n * 1.05) / PROS_PER_SITEMAP) + 2 : 0;
  const proSitemapsCount = avecMarge(count);
  const aiProSitemapsCount = avecMarge(techCount);
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

  // Date de derniere modification a la JOURNEE, pas a la milliseconde.
  // Avant (20/08/2026), c'etait `new Date().toISOString()` : a chaque
  // regeneration du cache, les 58 enfants annoncaient tous "modifie a
  // l'instant". Mesure : 17h20 la veille, 17h45 puis 18h23 le meme jour.
  // Google ignore purement et simplement une date qu'il juge peu fiable, et
  // nous perdons alors le seul moyen de lui signaler qu'un lot de fiches a
  // reellement change. A la journee, la valeur est stable d'une lecture a
  // l'autre et reste vraie : le parc bouge tous les jours (scrapes,
  // enrichissements, suppressions RGPD).
  const now = new Date().toISOString().slice(0, 10);
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
