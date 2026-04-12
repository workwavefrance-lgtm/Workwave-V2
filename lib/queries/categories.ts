import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/database";

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return (data as Category[]) || [];
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Category | null;
}

export async function getPopularCategoriesInCity(
  cityId: number,
  excludeCategoryId: number,
  limit: number = 6
): Promise<{ category: Category; count: number }[]> {
  const supabase = await createClient();

  // Compter les pros par categorie dans cette ville
  const { data: pros } = await supabase
    .from("pros")
    .select("category_id")
    .eq("city_id", cityId)
    .eq("is_active", true)
    .is("deleted_at", null)
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("vertical", vertical)
    .order("name");
  return (data as Category[]) || [];
}
