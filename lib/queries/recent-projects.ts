import { getAdminServiceClient } from "@/lib/admin/service-client";

/**
 * Projets récents ANONYMISÉS pour la home (section "Projets déposés récemment").
 *
 * RGPD : on ne SELECT QUE des champs non-identifiants — métier, ville, budget
 * (fourchette), urgence, date. JAMAIS first_name / email / phone / description BRUTE.
 * On expose UNIQUEMENT `ai_qualification.summary` (résumé IA déjà anonymisé : il dit
 * « le client » / « un particulier », jamais de nom/tél/email) comme teaser, avec un
 * garde-fou anti-PII en plus (cf. safeTeaser). Le résultat est mis en cache ISR.
 *
 * Service client obligatoire : la table `projects` a une RLS qui bloque l'anon
 * (elle contient des PII). On bypasse via service_role MAIS on ne remonte que les
 * colonnes safe ci-dessus → aucune PII ne sort jamais.
 *
 * Filtres : statut new/routed (pas suspicious/deleted/unrouted), ville non nulle,
 * verticaux BTP/domicile/personne (le vertical tech a sa propre home /ai).
 * Modulable : renvoie jusqu'à `limit` projets (la section s'adapte au nombre réel).
 */
export type PublicProject = {
  id: number;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  deptCode: string;
  /** Code postal de la commune — plus précis que le n° de département
   *  (« Villars (42390) » lève l'ambiguïté : il existe 4 Villars en France). */
  postalCode: string;
  budget: string | null;
  urgency: string | null;
  createdAt: string;
  /** Résumé IA anonymisé (sans PII) — teaser affiché sur la home. "" si vide/risqué. */
  teaser: string;
};

/**
 * Teaser = résumé IA (déjà anonymisé : « le client » / « un particulier », jamais de
 * nom/tél/email). Garde-fou en plus : on n'affiche RIEN si un @ ou une suite de
 * chiffres type téléphone traîne malgré tout. Tronqué pour la card.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeTeaser(aiq: any): string {
  const s = String(aiq?.summary ?? "").trim();
  if (!s) return "";
  if (s.includes("@") || /\d[\d .]{7,}\d/.test(s)) return "";
  return s.length > 140 ? s.slice(0, 137).trimEnd() + "…" : s;
}

export async function getRecentProjectsForHome(
  limit = 10
): Promise<PublicProject[]> {
  const sb = getAdminServiceClient();
  const { data, error } = await sb
    .from("projects")
    .select(
      "id, budget, urgency, created_at, ai_qualification, category:categories(name, slug), city:cities(name, postal_code, department:departments(code))"
    )
    .in("status", ["new", "routed"])
    .in("vertical", ["btp", "domicile", "personne"])
    .not("city_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .map((p) => ({
      id: p.id as number,
      categoryName: (p.category?.name as string) || "",
      categorySlug: (p.category?.slug as string) || "",
      cityName: (p.city?.name as string) || "",
      deptCode: (p.city?.department?.code as string) || "",
      postalCode: (p.city?.postal_code as string) || "",
      budget: p.budget && p.budget !== "unknown" ? (p.budget as string) : null,
      urgency: (p.urgency as string) || null,
      createdAt: p.created_at as string,
      teaser: safeTeaser(p.ai_qualification),
    }))
    .filter((p) => p.categoryName && p.cityName);
}
