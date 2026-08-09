import { cache } from "react";
// Client SANS cookies : `supabase/server` appelle cookies(), ce qui bascule
// TOUTE page qui l'utilise en rendu DYNAMIQUE (ISR/cache CDN inactif).
// Ces requetes sont des lectures publiques -> client leger obligatoire.
import { createPublicClient } from "@/lib/supabase/public-client";
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
  const supabase = createPublicClient();
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

// Regroupe les appels IDENTIQUES faits pendant le rendu d'une meme page
// (`generateMetadata` et la page appellent souvent la meme requete). Next le
// faisait deja, mais en dedoublant la REPONSE HTTP et en gardant la branche non
// lue jusqu'au ramasse-miettes : 512 Mo retenus en production le 09/08/2026.
// Cf. lib/supabase/fetch-supabase.ts. Regrouper le RESULTAT ne coute rien.
export const getBlogPostBySlug = cache(async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  return data as BlogPost | null;
})
