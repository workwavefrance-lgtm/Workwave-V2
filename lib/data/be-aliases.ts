/**
 * Alias métier BELGE (routing-only, zéro schema change, zéro pro déplacé).
 *
 * En Belgique, certains métiers ont un NOM propre différent du terme français :
 *   - « plafonneur »            = le plaquiste (pose de plaques/enduits, plafonnage)
 *   - « entreprise de châssis » = le menuisier spécialisé pose de châssis (fenêtres)
 *
 * Plutôt que de créer de VRAIES catégories en base (ce qui fragmenterait les
 * pros — un plafonneur EST un plaquiste — et ferait fuiter des URLs parasites
 * côté France via getAllCategories()), on expose ces termes comme des ALIAS
 * qui réutilisent 100 % des pros de la catégorie PARENTE.
 *
 * Fonctionnement : l'URL /plafonneur/liege tombe sur la route partagée
 * app/(public)/[metier]/[location]/page.tsx. getCategoryBySlug("plafonneur")
 * renvoie null → on tente getBeAlias("plafonneur") → on charge la catégorie
 * parente (plaquiste) pour TOUTES les requêtes/lookups keyés par slug, et on
 * surcharge SEULEMENT l'affichage (H1/title/schema = displayName) et l'URL
 * canonique (urlSlug = "plafonneur").
 *
 * GARDE-FOU OBLIGATOIRE côté page : ces alias ne sont servis QUE si la location
 * résolue est belge (country === "BE"). Sur une location FR → notFound(), sinon
 * /plafonneur/vienne-86 servirait les plaquistes français = duplicate content.
 *
 * Comme un alias n'entre JAMAIS dans getAllCategories(), il n'apparaît nulle
 * part côté FR (sitemap, maillage, "métiers similaires") — ses URLs sont
 * émises explicitement, BE-only, par un builder dédié dans app/sitemap.ts.
 */

export type BeAlias = {
  /** Slug tel qu'il apparaît dans l'URL (ex. "plafonneur"). */
  urlSlug: string;
  /** Slug de la catégorie française parente dont on réutilise les pros. */
  parentSlug: string;
  /** Nom affiché (H1, title, schema). Singulier. */
  displayName: string;
  /** Pluriel affiché (ex. "les 10 meilleurs plafonneurs"). */
  displayPlural: string;
  /** Article indéfini accordé au genre du displayName ("un" plafonneur, "une" entreprise). */
  article: string;
  /** Terme français équivalent, mentionné dans le contenu pour le maillage sémantique. */
  frenchTerm: string;
};

export const BE_ALIASES: Record<string, BeAlias> = {
  plafonneur: {
    urlSlug: "plafonneur",
    parentSlug: "plaquiste",
    displayName: "Plafonneur",
    displayPlural: "plafonneurs",
    article: "un",
    frenchTerm: "plaquiste",
  },
  "entreprise-de-chassis": {
    urlSlug: "entreprise-de-chassis",
    parentSlug: "menuisier",
    displayName: "Entreprise de châssis",
    displayPlural: "entreprises de châssis",
    article: "une",
    frenchTerm: "menuisier poseur de châssis",
  },
};

/** Renvoie l'alias belge correspondant à un slug d'URL, ou null si ce n'en est pas un. */
export function getBeAlias(slug: string): BeAlias | null {
  return BE_ALIASES[slug] ?? null;
}

/** Liste des slugs d'alias (pour le builder sitemap BE-only). */
export const BE_ALIAS_SLUGS = Object.keys(BE_ALIASES);
