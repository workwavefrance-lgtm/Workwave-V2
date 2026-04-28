import { createPublicClient } from "@/lib/supabase/public-client";
import type { Category, City } from "@/lib/types/database";

// Queries Supabase PUBLIQUES (sans cookies) pour les Server Components
// partages dans le layout (Footer, Header SSR si applicable) et la home.
//
// Pourquoi ce fichier separe ?
// `lib/queries/categories.ts` et `lib/queries/cities.ts` utilisent
// `lib/supabase/server.ts` qui appelle `cookies()`. Cela bascule en
// dynamic toute page (et tout layout !) qui les utilise => cache CDN
// inactif, TTFB 0.4s a chaque visite.
//
// Ces queries sont identiques en resultat mais utilisent un client sans
// cookies => les pages qui les consomment peuvent etre prerendered en
// static / ISR par Vercel Edge.
//
// Ne PAS utiliser ces fonctions dans des pages qui dependent de la
// session utilisateur (dashboard pro, admin, claim flow, etc.).

export async function getCategoriesByVerticalPublic(
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

export async function getTopCitiesPublic(
  limit: number = 20
): Promise<City[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as City[]) || [];
}

export async function getAllCategoriesPublic(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return (data as Category[]) || [];
}
