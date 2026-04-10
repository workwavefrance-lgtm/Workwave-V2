import { createClient } from "@/lib/supabase/server";
import type { Department } from "@/lib/types/database";
import { parseDepartmentSlug } from "@/lib/utils/slugs";

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
  return data as Department | null;
}
