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
  // PLUS DE `lastmod` SUR LES ENFANTS (05/09/2026).
  //
  // Il valait la date du JOUR, identique pour les 83 enfants, renouvelee
  // chaque matin. C'etait faux et Google le voit : le contenu de
  // /sitemap/100.xml s'etale du 07/06 au 03/09, il ne change pas tous les
  // jours. La documentation de Google est explicite : il n'utilise `lastmod`
  // que s'il le juge fiable, et il vaut mieux ne PAS en mettre que d'en
  // mettre un faux, parce qu'un faux lui apprend a ignorer le champ pour tout
  // le domaine.
  //
  // Ce que la mesure du 05/09 a etabli, et ce qu'elle n'a PAS etabli. Etabli :
  // Google telecharge l'index (30/08, puis 05/09 apres resoumission) mais n'a
  // enregistre qu'UN SEUL de ses 83 enfants, le flux de fraicheur. Non
  // etabli : que le `lastmod` en soit la cause. Ce qui est certain, c'est que
  // la valeur etait fausse ; on arrete donc de la produire, sans pretendre
  // que cela resoudra le non-telechargement.
  //
  // Ne pas remettre un `lastmod` ici sans pouvoir le calculer VRAIMENT, par
  // exemple le max(updated_at) des fiches de chaque lot. Une date inventee
  // vaut moins que pas de date.

  // Le sitemap « fraicheur » (ajoute le 01/09/2026) est le SEUL enfant dont
  // les dates par page sont reelles (updated_at) : c'est la file prioritaire
  // qu'on tend a Google. Cf. lib/queries/fraicheur.ts.

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tousLesIdsDeSitemap()
  .map(
    (id) =>
      `  <sitemap><loc>${BASE_URL}/sitemap/${id}.xml</loc></sitemap>`
  )
  .join("\n")}
  <sitemap><loc>${BASE_URL}/sitemap-fraicheur.xml</loc></sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
