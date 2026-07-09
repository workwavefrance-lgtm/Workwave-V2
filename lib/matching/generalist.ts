import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Métiers "généralistes" (homme toutes mains) : un pro inscrit sous une de ces
 * catégories peut réaliser presque tous les petits corps de métier. Il DOIT donc
 * recevoir tous les projets BTP de sa zone — pas seulement ceux étiquetés
 * "multiservice" (qui sont rarissimes, la plupart des clients choisissent un
 * métier précis).
 *
 * Décision Willy 09/07/2026. Sans risque : modèle pay-per-lead + le pro voit le
 * projet AVANT de payer → recevoir plus large = seulement du reach en plus,
 * il ignore ce qu'il ne veut pas faire.
 *
 * Slugs résolus → ids au runtime (JAMAIS d'id en dur — leçon CATEGORY_ID_MAP 26/05).
 */
export const GENERALIST_SLUGS = ["multiservice", "petit-bricolage"] as const;

/** Ids des catégories généralistes (multiservice, petit-bricolage). */
export async function getGeneralistCategoryIds(
  sb: SupabaseClient
): Promise<number[]> {
  const { data } = await sb
    .from("categories")
    .select("id")
    .in("slug", GENERALIST_SLUGS as unknown as string[]);
  return ((data || []) as { id: number }[]).map((c) => c.id);
}

/** Ids de TOUTES les catégories du vertical BTP (pour élargir un pro généraliste). */
export async function getAllBtpCategoryIds(
  sb: SupabaseClient
): Promise<number[]> {
  const { data } = await sb
    .from("categories")
    .select("id")
    .eq("vertical", "btp");
  return ((data || []) as { id: number }[]).map((c) => c.id);
}
