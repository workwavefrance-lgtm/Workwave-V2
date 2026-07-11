/**
 * Belgicismes du bâtiment : les Belges cherchent "toiturier" (pas "couvreur"),
 * "plafonneur" (pas "plaquiste"), "châssis" (pas "fenêtres"). Injectés dans les
 * titres + le contenu des pages BE pour capter ces requêtes locales à fort
 * volume que le vocabulaire français standard rate.
 *
 * Uniquement les termes où le mot belge diffère RÉELLEMENT et a du volume.
 * On ne force pas de synonyme là où le mot est identique (plombier, électricien,
 * maçon, peintre...).
 */
export type Belgicisme = { syn: string; synPlural: string };

export const BELGICISMES: Record<string, Belgicisme> = {
  couvreur: { syn: "toiturier", synPlural: "toituriers" },
  plaquiste: { syn: "plafonneur", synPlural: "plafonneurs" },
  menuisier: { syn: "poseur de châssis", synPlural: "poseurs de châssis" },
};

export function getBelgicisme(categorySlug: string): Belgicisme | null {
  return BELGICISMES[categorySlug] ?? null;
}
