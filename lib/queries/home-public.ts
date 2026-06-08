import { createPublicClient } from "@/lib/supabase/public-client";
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
// Ces queries sont identiques en resultat mais utilisent un client sans
// cookies => les pages qui les consomment peuvent etre prerendered en
// static / ISR par Vercel Edge.
//
// Ne PAS utiliser ces fonctions dans des pages qui dependent de la
// session utilisateur (dashboard pro, admin, claim flow, etc.).

// Sous forte charge BDD (scrape massif), une requete publique peut timeouter et
// renvoyer { data: null }. Le pattern `data || []` cachait alors une page VIDE en
// ISR (select metier sans <option>, grille categories vide) — bug constate le
// 08/06. Parade : on retry court, puis on THROW si echec persistant. Next.js
// conserve alors la derniere bonne version cachee (stale-while-revalidate) au
// lieu d'ecraser le cache avec du vide. Ne JAMAIS revenir a `data || []` ici.
// Au BUILD (`next build`) on NE casse PAS le déploiement si la BDD est injoignable :
// dernier recours = []. (Déployer BDD saine / scrape coupé pour éviter ce cas.)
// Au RUNTIME (revalidation ISR) on THROW => Next conserve la dernière bonne version
// cachée au lieu d'écraser avec du vide.
const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

async function publicQueryWithRetry<T>(
  label: string,
  run: () => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
  opts: { allowEmpty?: boolean } = {}
): Promise<T[]> {
  let last = "";
  for (let attempt = 1; attempt <= 6; attempt++) {
    const { data, error } = await run();
    if (!error && data && (opts.allowEmpty || data.length > 0)) return data as T[];
    last = error?.message ?? (data ? "resultat vide" : "data null");
    if (attempt < 6) await new Promise((r) => setTimeout(r, 200 * attempt));
  }
  if (IS_BUILD) {
    console.error(`[home-public] ${label}: echec au build (${last}) -> fallback [] (ne pas deployer pendant un scrape lourd)`);
    return [] as T[];
  }
  throw new Error(`[home-public] ${label}: echec apres 6 tentatives runtime (${last})`);
}

export async function getCategoriesByVerticalPublic(
  vertical: string
): Promise<Category[]> {
  const supabase = createPublicClient();
  // btp / domicile / personne ont toujours des lignes => un retour vide = anomalie BDD
  return publicQueryWithRetry<Category>(`categories[${vertical}]`, () =>
    supabase.from("categories").select("*").eq("vertical", vertical).order("name")
  );
}

export async function getTopCitiesPublic(
  limit: number = 20
): Promise<City[]> {
  const supabase = createPublicClient();
  return publicQueryWithRetry<City>("topCities", () =>
    supabase
      .from("cities")
      .select("*")
      .order("population", { ascending: false, nullsFirst: false })
      .limit(limit)
  );
}

export async function getAllCategoriesPublic(): Promise<Category[]> {
  const supabase = createPublicClient();
  return publicQueryWithRetry<Category>("allCategories", () =>
    supabase.from("categories").select("*").order("name")
  );
}

// Lookup CIBLÉ par slug (clé de cache distincte par slug) — utilisé par les
// pages /trouver-des-{chantiers,clients}/[slug]. Avantage vs getAllCategoriesPublic :
// une catégorie nouvellement créée est résolue immédiatement, sans dépendre de
// l'expiration du cache de la requête "toutes les catégories" (bug Vague 3 :
// multiservice & co restaient en notFound car la liste complète était périmée).
export async function getCategoryBySlugPublic(
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
}

export async function getAllDepartmentsPublic(): Promise<Department[]> {
  const supabase = createPublicClient();
  return publicQueryWithRetry<Department>("allDepartments", () =>
    supabase.from("departments").select("*").order("code")
  );
}
