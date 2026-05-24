/**
 * Selection des "meilleurs" pros pour les pages listing
 * `/[metier]/[ville]` et `/[metier]/[departement]` style "Top X
 * meilleurs [metier] a [ville] en {annee}".
 *
 * Scoring composite et objectif (pas de boost abonnes Workwave —
 * les abonnes beneficient du routing automatique des leads sprint 5,
 * pas d'un boost de visibilite cache). Cf. discussion 24/05/2026.
 *
 * Strategie :
 * 1. Fetch tous les pros eligibles de la catégorie × zone (max 500)
 * 2. Calcul du score en JS pour chaque pro (rapide, pas de SQL custom)
 * 3. Tri DESC par score, tie-breaker sur nom alphabetique
 * 4. Retourne top N + count total
 *
 * Le scoring fonctionne meme sans donnees Google (281 pros sur 226k
 * sont enrichis) : la base score utilise profile_completion + certifs
 * + claimed + photos + anciennete (toujours dispos).
 */
import { createClient } from "@/lib/supabase/server";
import type { Pro, ProWithRelations } from "@/lib/types/database";

const PRO_SELECT =
  "*, category:categories(*), city:cities(*, department:departments(*))";

// Plafond defensif : on score en JS, donc on limite le fetch pour
// eviter d'aspirer 200+ pros sur une grosse ville. La selection
// reste bonne meme avec un sample partiel : les meilleurs scores
// sortent au-dessus de toute facon.
const MAX_FETCH = 500;

/**
 * Calcule un score composite pour un pro.
 *
 * Echelle indicative (max theorique ~170) :
 *   Profil :       0-30  (profile_completion)
 *   Anciennete :   0-20  (1pt par an depuis founded_year, cappe a 20)
 *   Reclamation :  +15   (claimed_by_user_id IS NOT NULL)
 *   Certifs :      0-25  (5pts par cert, jusqu'a 5 certs)
 *   RGE officiel : +10   (rge_certified via ADEME sync)
 *   Decennale :    +5    (has_decennale)
 *   RC Pro :       +5    (has_rc_pro)
 *   Photos :       0-15  (5pts par photo, jusqu'a 3)
 *   Description :  0-15  (5pts par tranche de 100 chars, max 3)
 *   Google rating : 0-30 (+30 si >=4.5, +15 si >=4.0, +5 si >=3.5)
 *   Google avis :  0-20  (+20 si >=10, +10 si >=3, +5 si >=1)
 *
 * Note : on penalise legerement les "is_active: false" deja exclus
 * en amont, et on ne prend que les non-deleted.
 */
export function computeProScore(pro: Pro): number {
  let score = 0;

  // 1. Completude profil (signal de qualite generale)
  score += Math.min(pro.profile_completion ?? 0, 30) * 0.3 + 0;
  // ↑ profile_completion est 0-100, on plafonne sa contribution a 30 points
  // en multipliant par 0.3. Plus simple ecrire :
  score = (pro.profile_completion ?? 0) * 0.3;

  // 2. Anciennete depuis Sirene
  const foundedYear = pro.founded_year ?? null;
  if (foundedYear && foundedYear > 1900 && foundedYear <= new Date().getFullYear()) {
    const age = new Date().getFullYear() - foundedYear;
    score += Math.min(age, 20);
  }

  // 3. Fiche reclamee = pro engage
  if (pro.claimed_by_user_id) score += 15;

  // 4. Certifications metier
  const certs = pro.certifications ?? [];
  score += Math.min(certs.length, 5) * 5;

  // 5. RGE certifie officiellement (sync ADEME)
  if (pro.rge_certified) score += 10;

  // 6. Assurances declarees
  if (pro.has_decennale) score += 5;
  if (pro.has_rc_pro) score += 5;

  // 7. Photos
  const photos = pro.photos ?? [];
  score += Math.min(photos.length, 3) * 5;

  // 8. Description (signal de fiche enrichie)
  const desc = pro.description ?? "";
  if (desc.length > 0) {
    score += Math.min(Math.floor(desc.length / 100), 3) * 5;
  }

  // 9. Google rating (281 pros enrichis seulement, gros bonus quand present)
  const rating = pro.google_rating ?? 0;
  if (rating >= 4.5) score += 30;
  else if (rating >= 4.0) score += 15;
  else if (rating >= 3.5) score += 5;

  // 10. Google reviews count
  const reviews = pro.google_reviews_count ?? 0;
  if (reviews >= 10) score += 20;
  else if (reviews >= 3) score += 10;
  else if (reviews >= 1) score += 5;

  return Math.round(score);
}

/**
 * Recupere les top N pros d'une catégorie dans une ville donnee,
 * tries par score decroissant. Le total des pros disponibles est
 * aussi retourne (pour afficher "Voir les X autres" si total > limit).
 */
export async function getTopProsByCategoryAndCity(
  categoryId: number,
  cityId: number,
  limit = 10
): Promise<{ tops: ProWithRelations[]; total: number }> {
  const supabase = await createClient();

  // Fetch jusqu'a MAX_FETCH pros pour scoring
  const { data, count } = await supabase
    .from("pros")
    .select(PRO_SELECT, { count: "estimated" })
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(MAX_FETCH);

  const pros = (data as ProWithRelations[] | null) ?? [];

  // Score + tri DESC, tie-break alphabetique
  const scored = pros
    .map((p) => ({ pro: p, score: computeProScore(p) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.pro.name ?? "").localeCompare(b.pro.name ?? "");
    });

  const tops = scored.slice(0, limit).map((s) => s.pro);
  const total = count ?? pros.length;

  return { tops, total };
}

/**
 * Idem pour une page departement. On recupere les city_ids du dept
 * puis on score sur l'ensemble. Sur les gros departements (ex. Gironde
 * avec ~500 communes), on peut avoir beaucoup de pros : on plafonne a
 * MAX_FETCH au total.
 */
export async function getTopProsByCategoryAndDepartment(
  categoryId: number,
  departmentId: number,
  limit = 10
): Promise<{ tops: ProWithRelations[]; total: number }> {
  const supabase = await createClient();

  const { data: cities } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", departmentId);
  const cityIds = (cities || []).map((c: { id: number }) => c.id);
  if (cityIds.length === 0) return { tops: [], total: 0 };

  const { data, count } = await supabase
    .from("pros")
    .select(PRO_SELECT, { count: "estimated" })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(MAX_FETCH);

  const pros = (data as ProWithRelations[] | null) ?? [];

  const scored = pros
    .map((p) => ({ pro: p, score: computeProScore(p) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.pro.name ?? "").localeCompare(b.pro.name ?? "");
    });

  const tops = scored.slice(0, limit).map((s) => s.pro);
  const total = count ?? pros.length;

  return { tops, total };
}
