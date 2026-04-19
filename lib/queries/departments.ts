import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/lib/types/database";
import { generateDepartmentSlug, parseDepartmentSlug } from "@/lib/utils/slugs";

export async function getAllDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .order("code");
  return (data as Department[]) || [];
}

export async function getDepartmentBySlug(
  slug: string
): Promise<Department | null> {
  const parsed = parseDepartmentSlug(slug);
  if (!parsed) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("code", parsed.code)
    .single();
  const dept = data as Department | null;
  if (!dept) return null;

  // Strict slug match : éviter qu'un slug type "saint-savin-86" matche le
  // département Vienne uniquement parce qu'il finit par "-86". On regénère
  // le slug canonique du département trouvé et on compare strictement avec
  // le slug fourni en entrée. Sans cette garde, n'importe quel slug "xxx-NN"
  // résolverait au département de code NN, ce qui produit du duplicate
  // content massif (ex. /macon/saint-savin-86 servait la page Vienne avec
  // 997 maçons à la place d'un 404).
  if (slug !== generateDepartmentSlug(dept)) return null;

  return dept;
}
