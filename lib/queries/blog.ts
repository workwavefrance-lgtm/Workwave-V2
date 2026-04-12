import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  category_slug: string | null;
  city_slug: string | null;
  tags: string[];
  author: string;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getPublishedPosts(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ data: BlogPost[]; count: number; totalPages: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .range(from, to);

  const total = count || 0;

  return {
    data: (data as BlogPost[]) || [],
    count: total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  return data as BlogPost | null;
}
