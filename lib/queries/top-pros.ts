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

  // 11. Avis natifs Workwave (preuve la plus forte : mise en relation
  // verifiee + avis post-prestation). Bonus plus important que Google
  // pour reconnaitre le moat qu'on construit.
  const wwRating = pro.workwave_reviews_avg ?? 0;
  const wwCount = pro.workwave_reviews_count ?? 0;
  if (wwRating >= 4.5 && wwCount >= 3) score += 40;
  else if (wwRating >= 4.0 && wwCount >= 2) score += 25;
  else if (wwRating >= 3.5 && wwCount >= 1) score += 10;
  // Bonus volume independant du rating (active la pro)
  if (wwCount >= 10) score += 15;
  else if (wwCount >= 3) score += 8;

  return Math.round(score);
}

/**
 * Score + tri DESC (tie-break alphabetique) + slice top N.
 * Factorise la logique partagee par les variantes ville / villes / dept.
 *
 * Sprint 13 : les pros reclames (compte cree, engagement reel) sortent
 * toujours AVANT les fiches scrapees Sirene non reclamees. Boost commercial
 * fort : incite les pros a reclamer leur fiche pour gagner en visibilite. Le
 * score departage les claimed entre eux.
 */
function scoreAndSelectTop(
  pros: ProWithRelations[],
  limit: number
): ProWithRelations[] {
  return pros
    .map((p) => ({ pro: p, score: computeProScore(p) }))
    .sort((a, b) => {
      const aClaimed = !!a.pro.claimed_by_user_id;
      const bClaimed = !!b.pro.claimed_by_user_id;
      if (aClaimed !== bClaimed) return aClaimed ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return (a.pro.name ?? "").localeCompare(b.pro.name ?? "");
    })
    .slice(0, limit)
    .map((s) => s.pro);
}

/**
 * Coeur : top N pros d'une catégorie sur un ENSEMBLE de villes (1 ou plusieurs),
 * tries par score. Le total disponible est aussi retourne (pour "Voir les X
 * autres"). Utilise par la variante ville unique, la variante dept et
 * l'agregation des arrondissements (Marseille/Lyon/Paris).
 */
export async function getTopProsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[],
  limit = 10
): Promise<{ tops: ProWithRelations[]; total: number }> {
  if (cityIds.length === 0) return { tops: [], total: 0 };
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("pros")
    .select(PRO_SELECT, { count: "estimated" })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(MAX_FETCH);

  const pros = (data as ProWithRelations[] | null) ?? [];
  // count:"estimated" peut renvoyer 0 (faux) sur un petit ensemble filtré —
  // ce qui déclencherait à tort le redirect 308 "0 pro". On retombe sur le
  // nombre RÉELLEMENT récupéré (exact pour <= MAX_FETCH), via max(). Cf. la
  // leçon "estimated ignore/sous-estime les filtres" — ici pros.length est la
  // source fiable pour les petites zones (arrondissements, zone Monaco).
  const total = Math.max(count ?? 0, pros.length);
  return { tops: scoreAndSelectTop(pros, limit), total };
}

/**
 * Top N pros d'une catégorie dans une ville donnee.
 */
export async function getTopProsByCategoryAndCity(
  categoryId: number,
  cityId: number,
  limit = 10
): Promise<{ tops: ProWithRelations[]; total: number }> {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from("pros")
    .select(PRO_SELECT, { count: "estimated" })
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(MAX_FETCH);

  const pros = (data as ProWithRelations[] | null) ?? [];
  // count:"estimated" peut renvoyer 0 (faux) sur un petit ensemble filtré —
  // ce qui déclencherait à tort le redirect 308 "0 pro". On retombe sur le
  // nombre RÉELLEMENT récupéré (exact pour <= MAX_FETCH), via max(). Cf. la
  // leçon "estimated ignore/sous-estime les filtres" — ici pros.length est la
  // source fiable pour les petites zones (arrondissements, zone Monaco).
  const total = Math.max(count ?? 0, pros.length);
  return { tops: scoreAndSelectTop(pros, limit), total };
}

/**
 * Idem pour une page departement. On recupere les city_ids du dept
 * puis on delegue au coeur multi-villes (plafond MAX_FETCH au total).
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

  return getTopProsByCategoryAndCityIds(categoryId, cityIds, limit);
}
