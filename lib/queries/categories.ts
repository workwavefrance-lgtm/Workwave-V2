import { cache } from "react";
// Client SANS cookies : `supabase/server` appelle cookies(), ce qui bascule
// TOUTE page qui l'utilise en rendu DYNAMIQUE (ISR/cache CDN inactif).
// Ces requetes sont des lectures publiques -> client leger obligatoire.
import { createPublicClient } from "@/lib/supabase/public-client";
import { FILTRE_OUVERTS } from "@/lib/queries/pros";
import type { Category } from "@/lib/types/database";

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const getAllCategories = cache(async function getAllCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return (data as Category[]) || [];
})

/** Champs strictement nécessaires à un sélecteur de catégorie. */
export type CategoryOption = Pick<Category, "id" | "name" | "vertical">;

/**
 * Version LÉGÈRE de getAllCategories() pour les sélecteurs du dashboard pro.
 *
 * PERF : getAllCategories() fait un `SELECT *` sur les 183 catégories
 * (description, seo_keywords, naf_codes…) et le tableau entier était sérialisé
 * vers le téléphone du pro pour alimenter un simple menu déroulant : de l'ordre
 * de 60 à 150 Ko de JSON inutile à télécharger ET à parser sur mobile.
 * Ici : 3 champs, et uniquement les verticaux physiques (le dashboard BTP ne
 * peut de toute façon pas proposer les ~145 catégories tech/AI). ~2 Ko.
 *
 * NB : on ne touche PAS getAllCategories(), utilisé par le sitemap, les pages
 * publiques et l'admin.
 */
export async function getCategoriesForPicker(): Promise<CategoryOption[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, vertical")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("name");
  return (data as CategoryOption[]) || [];
}

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const getCategoryBySlug = cache(async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Category | null;
})

export async function getPopularCategoriesInCity(
  cityId: number,
  excludeCategoryId: number,
  limit: number = 6
): Promise<{ category: Category; count: number }[]> {
  const supabase = createPublicClient();

  // Compter les pros par categorie dans cette ville
  const { data: pros } = await supabase
    .from("pros")
    .select("category_id")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(FILTRE_OUVERTS) // le compte « (N) » affiché exclut les établissements fermés (02/09)
    .neq("category_id", excludeCategoryId);

  if (!pros || pros.length === 0) return [];

  // Compter par category_id
  const counts = new Map<number, number>();
  for (const p of pros) {
    counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
  }

  // Trier par count descending, prendre les top N
  const sorted = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  // Charger les categories
  const categoryIds = sorted.map(([id]) => id);
  const { data: cats } = await supabase
    .from("categories")
    .select("*")
    .in("id", categoryIds);

  const catMap = new Map((cats as Category[] || []).map((c) => [c.id, c]));

  return sorted
    .map(([id, count]) => ({ category: catMap.get(id)!, count }))
    .filter((r) => r.category);
}

export async function getCategoriesByVertical(
  vertical: string
): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("vertical", vertical)
    .order("name");
  return (data as Category[]) || [];
}
