import { getAdminServiceClient } from "@/lib/admin/service-client";
import { safeTeaser } from "@/lib/utils/safe-teaser";

/**
 * Projets récents ANONYMISÉS pour la home (section "Projets déposés récemment").
 *
 * RGPD : on ne RENVOIE que des champs non-identifiants : métier, ville, budget
 * (fourchette), urgence, date. JAMAIS email / phone / description BRUTE.
 * Le teaser vient de `ai_qualification.summary`, filtré par `safeTeaser`.
 *
 * 🔴 20/09/2026 : ce commentaire affirmait que le résumé IA était « déjà
 * anonymisé, jamais de nom ». C'est FAUX, mesuré : 1 résumé sur 25 nommait le
 * déposant et l'artisan. `safeTeaser` (lib/utils/safe-teaser.ts) écarte
 * désormais ces cas, et `first_name` est chargé UNIQUEMENT pour alimenter ce
 * filtre. Il ne figure dans aucun champ de `PublicProject` et ne doit jamais y
 * être ajouté : ce qui sort d'ici est public et indexable.
 *
 * Le résultat est mis en cache ISR.
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
  /** Code postal de la commune, plus précis que le n° de département
   *  (« Villars (42390) » lève l'ambiguïté : il existe 4 Villars en France). */
  postalCode: string;
  budget: string | null;
  urgency: string | null;
  createdAt: string;
  /** Résumé IA anonymisé (sans PII), teaser affiché sur la home. "" si vide/risqué. */
  teaser: string;
};

export async function getRecentProjectsForHome(
  limit = 10
): Promise<PublicProject[]> {
  const sb = getAdminServiceClient();
  const { data, error } = await sb
    .from("projects")
    .select(
      // `first_name` sert EXCLUSIVEMENT au filtre anti-nom de safeTeaser et ne
      // ressort jamais de cette fonction (cf. le bloc de commentaires au-dessus
      // de safeTeaser). Ne jamais l'ajouter à l'objet renvoyé.
      "id, budget, urgency, created_at, ai_qualification, first_name, category:categories(name, slug), city:cities(name, postal_code, department:departments(code))"
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
      teaser: safeTeaser(p.ai_qualification, p.first_name ?? null),
    }))
    .filter((p) => p.categoryName && p.cityName);
}
