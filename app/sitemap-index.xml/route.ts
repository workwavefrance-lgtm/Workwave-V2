/**
 * Sitemap index : la SEULE adresse a soumettre a Google. Elle nomme les
 * sous-sitemaps produits par app/sitemap.ts (generateSitemaps).
 *
 * A soumettre dans Search Console : https://workwave.fr/sitemap-index.xml
 * Ne JAMAIS soumettre un sous-sitemap individuellement (lecon du 29/04/2026).
 *
 * Cette route ne fait AUCUN appel a la base. Elle en faisait deux jusqu'au
 * 20/08/2026, avec un comptage `estimated` qui derivait des statistiques de
 * pg_class : apres la suppression des 121 197 doublons, il sous-estimait le
 * parc de 61 687 lignes et l'index cessait de nommer /sitemap/142.xml et
 * /sitemap/211.xml, pourtant construits et servis. 54 970 fiches sont restees
 * invisibles de Google sans qu'aucune erreur ne soit signalee.
 * La liste vient desormais de lib/seo/sitemap-ids.ts, partagee avec
 * app/sitemap.ts : les deux ne peuvent plus diverger.
 */
import { BASE_URL } from "@/lib/constants";
import { tousLesIdsDeSitemap } from "@/lib/seo/sitemap-ids";

export const revalidate = 86400; // 24 h

export async function GET() {
  // Date a la JOURNEE, pas a la milliseconde. Elle valait
  // `new Date().toISOString()` : a chaque regeneration du cache, les 58
  // enfants annoncaient tous "modifie a l'instant" (mesure : 17h20 la veille,
  // 17h45 puis 18h23 le meme jour). Google ignore une date qu'il juge peu
  // fiable, et on perd alors le seul moyen de lui signaler qu'un lot de
  // fiches a reellement change. A la journee, la valeur est stable d'une
  // lecture a l'autre et reste vraie : le parc bouge tous les jours.
  const jour = new Date().toISOString().slice(0, 10);

  // Le sitemap « fraicheur » (ajoute le 01/09/2026) est le SEUL enfant dont
  // les dates par page sont reelles (updated_at) : c'est la file prioritaire
  // qu'on tend a Google. Cf. lib/queries/fraicheur.ts.

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tousLesIdsDeSitemap()
  .map(
    (id) =>
      `  <sitemap><loc>${BASE_URL}/sitemap/${id}.xml</loc><lastmod>${jour}</lastmod></sitemap>`
  )
  .join("\n")}
  <sitemap><loc>${BASE_URL}/sitemap-fraicheur.xml</loc><lastmod>${jour}</lastmod></sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
