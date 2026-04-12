import { createClient } from "@/lib/supabase/server";

export type SeoGuide = {
  id: number;
  category_id: number;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  table_of_contents: { title: string; anchor: string }[] | null;
  author: string;
  generated_at: string;
  updated_at: string;
};

export async function getGuideBySlug(
  slug: string
): Promise<SeoGuide | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_guides")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as SeoGuide | null;
}

export async function getAllGuides(): Promise<SeoGuide[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_guides")
    .select("*")
    .order("slug");
  return (data as SeoGuide[]) || [];
}
