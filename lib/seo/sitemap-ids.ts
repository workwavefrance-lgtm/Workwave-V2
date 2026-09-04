/**
 * SOURCE UNIQUE des identifiants de sous-sitemaps.
 *
 * Pourquoi ce fichier existe (20/08/2026). Deux endroits calculaient la meme
 * chose de deux facons differentes :
 *   - app/sitemap.ts  : nombres ecrits en dur, avec marge -> fichiers 100..147 et 200..213
 *   - app/sitemap-index.xml : comptage `estimated` en base -> declarait 100..141 et 200..210
 * Resultat mesure : /sitemap/142.xml servait 41 158 adresses reelles et
 * /sitemap/211.xml 13 812, tous deux CONSTRUITS ET SERVIS, mais jamais nommes
 * dans l'index. 54 970 fiches invisibles de Google, sans la moindre erreur
 * signalee nulle part.
 *
 * La cause n'etait pas le comptage : c'etait d'en avoir deux. Les deux fichiers
 * lisent desormais cette liste, et ne peuvent plus diverger.
 *
 * ⚠️ A BUMPER APRES UN GROS SCRAPE. Les valeurs doivent couvrir :
 *     NB_SITEMAPS_PROS    >= ceil(pros non tech / 45 000)
 *     NB_SITEMAPS_PROS_AI >= ceil(pros tech     / 45 000)
 * Mesure du 20/08/2026 : 1 931 158 non tech -> 43 necessaires (48 declares),
 * 508 812 tech -> 12 necessaires (14 declares).
 *
 * La marge est VOLONTAIRE et l'asymetrie tranche : un sous-sitemap au-dela des
 * donnees repond 200 avec un `urlset` vide et ne coute rien, tandis qu'un
 * fichier manquant coute 45 000 pages. Ne jamais reduire ces nombres au plus
 * juste. En revanche, ne jamais les monter au-dela de ce que construit
 * generateSitemaps() : un identifiant non construit repond 404, et un enfant
 * en 404 fait passer tout le sitemap en erreur dans Search Console.
 */

/** 0 statique + guides + blog, 1 metier x dept, 2 metier x ville, 3 specialites, 4 Workwave AI. */
export const SITEMAP_IDS_FIXES = [0, 1, 2, 3, 4] as const;
// Sous-sitemaps des pages metier x ville. Mesure du 04/09/2026 : 83 406 de
// ces pages existent avec au moins 3 artisans ouverts, sur 13 665 communes,
// alors que le sitemap n en declarait que 8 405 (plafond TOP_CITIES = 300 des
// 35 163 communes). Une page de sitemap ne peut pas depasser 50 000 adresses :
// il en faut donc plusieurs. Marge volontaire, un sous-sitemap vide est
// inoffensif alors qu un sous-sitemap non declare rend ses pages invisibles
// (lecon du 20/08).
export const SITEMAP_CAT_CITY_OFFSET = 300;
export const NB_SITEMAPS_CAT_CITY = 4;
export const CAT_CITY_PAR_SITEMAP = 45000;

export const SITEMAP_PROS_OFFSET = 100;
export const SITEMAP_PROS_AI_OFFSET = 200;
export const NB_SITEMAPS_PROS = 48;
export const NB_SITEMAPS_PROS_AI = 14;

/** Tous les identifiants, dans l'ordre. C'est la liste que sert l'index. */
export function tousLesIdsDeSitemap(): number[] {
  return [
    ...SITEMAP_IDS_FIXES,
    ...Array.from({ length: NB_SITEMAPS_CAT_CITY }, (_, i) => SITEMAP_CAT_CITY_OFFSET + i),
    ...Array.from({ length: NB_SITEMAPS_PROS }, (_, i) => SITEMAP_PROS_OFFSET + i),
    ...Array.from({ length: NB_SITEMAPS_PROS_AI }, (_, i) => SITEMAP_PROS_AI_OFFSET + i),
  ];
}
