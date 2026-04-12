import { createClient } from "@/lib/supabase/server";

export type FaqItem = { question: string; answer: string };

export type SeoPage = {
  id: number;
  slug: string;
  type: "metier_ville" | "metier_dept";
  category_id: number;
  city_id: number | null;
  department_id: number | null;
  title: string;
  meta_description: string;
  content: string;
  faq_json: FaqItem[] | null;
  generated_at: string;
};

export async function getSeoContent(
  categoryId: number,
  locationId: number,
  locationType: "city" | "department"
): Promise<SeoPage | null> {
  const supabase = await createClient();

  const query = supabase
    .from("seo_pages")
    .select("*")
    .eq("category_id", categoryId);

  if (locationType === "city") {
    query.eq("city_id", locationId);
  } else {
    query.eq("department_id", locationId).is("city_id", null);
  }

  const { data } = await query.limit(1).single();
  return data as SeoPage | null;
}
