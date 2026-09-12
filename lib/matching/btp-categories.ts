import type { SupabaseClient } from "@supabase/supabase-js";
import { GENERALIST_SLUGS } from "./generalist";

const MATCHING_CLUSTERS = [["plombier", "chauffagiste", "climaticien"]];

export type MatchingCategory = { id: number; slug: string; vertical: string };
export type ProCategories = {
  category_id: number;
  secondary_category_ids?: number[] | null;
};

/** Une même règle sert à la diffusion, au dashboard et au mail de bienvenue. */
export function createBtpCategoryRules(categories: MatchingCategory[]) {
  const bySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const clusters = MATCHING_CLUSTERS.map((slugs) =>
    slugs.map((slug) => bySlug.get(slug)).filter((id): id is number => id != null)
  );
  const generalistIds = GENERALIST_SLUGS
    .map((slug) => bySlug.get(slug))
    .filter((id): id is number => id != null);
  const btpIds = categories.filter((c) => c.vertical === "btp").map((c) => c.id);

  function relatedCategoryIds(categoryId: number): number[] {
    return clusters.find((ids) => ids.includes(categoryId)) ?? [categoryId];
  }

  function projectCategoryIdsForPro(pro: ProCategories): number[] {
    const ids = new Set(
      [pro.category_id, ...(pro.secondary_category_ids ?? [])]
        .flatMap(relatedCategoryIds)
    );
    // Une compétence secondaire de bricolage ne transforme pas un pro en
    // généraliste. Même en activité principale, elle n'étend qu'aux métiers BTP.
    if (generalistIds.includes(pro.category_id)) btpIds.forEach((id) => ids.add(id));
    return [...ids];
  }

  function proCategoryFilterForProject(projectCategoryId: number): string {
    const clauses = relatedCategoryIds(projectCategoryId).flatMap((id) => [
      `category_id.eq.${id}`,
      `secondary_category_ids.cs.{${id}}`,
    ]);
    if (btpIds.includes(projectCategoryId)) {
      generalistIds.forEach((id) => clauses.push(`category_id.eq.${id}`));
    }
    return [...new Set(clauses)].join(",");
  }

  return { relatedCategoryIds, projectCategoryIdsForPro, proCategoryFilterForProject };
}

export async function getBtpCategoryRules(sb: SupabaseClient) {
  const categories: MatchingCategory[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await sb.from("categories")
      .select("id, slug, vertical")
      .order("id")
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`Chargement des métiers impossible : ${error.message}`);
    const rows = (data ?? []) as MatchingCategory[];
    categories.push(...rows);
    if (rows.length < pageSize) break;
  }
  return createBtpCategoryRules(categories);
}
