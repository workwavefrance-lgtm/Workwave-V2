import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public-client";
import { getAllCategories } from "./categories";
import { getAllDepartments } from "./departments";
import type { Category, City, Department } from "@/lib/types/database";

// Queries Supabase PUBLIQUES (sans cookies) pour les Server Components
// partages dans le layout (Footer, Header SSR si applicable) et la home.
//
// Pourquoi ce fichier separe ?
// `lib/queries/categories.ts` et `lib/queries/cities.ts` utilisent
// `lib/supabase/server.ts` qui appelle `cookies()`. Cela bascule en
// dynamic toute page (et tout layout !) qui les utilise => cache CDN
// inactif, TTFB 0.4s a chaque visite.
//
// 09/08/2026 : cette raison d'etre a DISPARU. Depuis le 02/08, categories.ts et
// cities.ts utilisent eux aussi `createPublicClient` (sans cookies). Les
// fonctions ci-dessous etaient donc devenues des copies mot pour mot, et le pied
// de page + la page emettaient DEUX requetes Supabase identiques a chaque rendu.
// Elles delèguent desormais aux modules canoniques, qui regroupent les appels
// via `cache` de React. Les noms sont conserves : ~40 fichiers les importent.
//
// Ne PAS utiliser ces fonctions dans des pages qui dependent de la
// session utilisateur (dashboard pro, admin, claim flow, etc.).

// Regroupe les appels IDENTIQUES pendant le rendu d'une meme page : le pied de
// page ET la page appellent ces requetes. Cf. lib/supabase/fetch-supabase.ts :
// Next le faisait en dedoublant la reponse HTTP, ce qui retenait 512 Mo.
export const getCategoriesByVerticalPublic = cache(async function getCategoriesByVerticalPublic(
  vertical: string
): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("vertical", vertical)
    .order("name");
  return (data as Category[]) || [];
})

// Regroupe les appels IDENTIQUES pendant le rendu d'une meme page : le pied de
// page ET la page appellent ces requetes. Cf. lib/supabase/fetch-supabase.ts :
// Next le faisait en dedoublant la reponse HTTP, ce qui retenait 512 Mo.
export const getTopCitiesPublic = cache(async function getTopCitiesPublic(
  limit: number = 20
): Promise<City[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as City[]) || [];
})

// Regroupe les appels IDENTIQUES pendant le rendu d'une meme page : le pied de
// page ET la page appellent ces requetes. Cf. lib/supabase/fetch-supabase.ts :
// Next le faisait en dedoublant la reponse HTTP, ce qui retenait 512 Mo.
export const getAllCategoriesPublic = getAllCategories;

// Lookup CIBLÉ par slug (clé de cache distincte par slug), utilisé par les
// pages /trouver-des-{chantiers,clients}/[slug]. Avantage vs getAllCategoriesPublic :
// une catégorie nouvellement créée est résolue immédiatement, sans dépendre de
// l'expiration du cache de la requête "toutes les catégories" (bug Vague 3 :
// multiservice & co restaient en notFound car la liste complète était périmée).
// Regroupe les appels IDENTIQUES pendant le rendu d'une meme page : le pied de
// page ET la page appellent ces requetes. Cf. lib/supabase/fetch-supabase.ts :
// Next le faisait en dedoublant la reponse HTTP, ce qui retenait 512 Mo.
export const getCategoryBySlugPublic = cache(async function getCategoryBySlugPublic(
  slug: string
): Promise<Category | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  return (data as Category) || null;
})

// Regroupe les appels IDENTIQUES pendant le rendu d'une meme page : le pied de
// page ET la page appellent ces requetes. Cf. lib/supabase/fetch-supabase.ts :
// Next le faisait en dedoublant la reponse HTTP, ce qui retenait 512 Mo.
export const getAllDepartmentsPublic = getAllDepartments;
