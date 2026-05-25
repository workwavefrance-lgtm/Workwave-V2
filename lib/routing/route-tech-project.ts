/**
 * Routing des projets tech (vertical='tech') vers les 3 meilleurs
 * freelances eligibles.
 *
 * Strategie simple (Phase 7 MVP) : sans abonnement Stripe, on retourne
 * juste les 3 profils les plus pertinents pour matcher le projet ; on
 * stocke le routing dans project_leads pour visibilite admin. Les
 * freelances ne recoivent PAS d'email (pas d'email Sirene), uniquement
 * l'admin recoit la notif avec les 3 profils.
 *
 * Plus tard (Phase 8 avec Stripe), seuls les freelances abonnes (29,90€/
 * mois) seront notifies par mail des nouveaux briefs matchant.
 *
 * Critere de matching :
 *   - category_id matches (filtre dur)
 *   - source = 'sirene' (vrais freelances scrapes)
 *   - is_active = true, deleted_at IS NULL (filtre dur)
 *   - Score compose :
 *      + 50 pts si postal_code commence par meme prefix dept que le projet
 *      + 30 pts si github_username non null (signal qualite)
 *      + jusqu'a 20 pts pour years_experience (0-20 ans, ratio)
 *
 *   Tri par score desc, top 3 retenus.
 */
import { createClient } from "@supabase/supabase-js";

export type TechProjectInput = {
  category_id: number;
  postal_code: string | null;
};

export type RoutedFreelance = {
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  github_username: string | null;
  years_experience: number | null;
  score: number;
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function calculateScore(opts: {
  sameDept: boolean;
  hasGithub: boolean;
  yearsExperience: number | null;
}): number {
  let score = 0;
  if (opts.sameDept) score += 50;
  if (opts.hasGithub) score += 30;
  if (opts.yearsExperience != null) {
    score += Math.min(20, Math.max(0, opts.yearsExperience));
  }
  return score;
}

export async function routeTechProject(
  input: TechProjectInput
): Promise<RoutedFreelance[]> {
  const sb = getServiceClient();

  const projectDeptPrefix = input.postal_code
    ? input.postal_code.slice(0, 2)
    : null;

  // Strategie : on charge un pool d'eligibles puis on score en memoire.
  // Pour ne pas charger les 110k, on prefiltre :
  //   1. meme dept en priorite (via LIKE postal_code prefix)
  //   2. si moins de 100 eligibles trouves, on elargit France entiere
  let candidates: Array<{
    id: number;
    name: string;
    slug: string;
    postal_code: string | null;
    github_username: string | null;
    years_experience: number | null;
  }> = [];

  if (projectDeptPrefix) {
    const { data: localPros } = await sb
      .from("pros")
      .select("id, name, slug, postal_code, github_username, years_experience")
      .eq("category_id", input.category_id)
      .eq("source", "sirene")
      .eq("is_active", true)
      .is("deleted_at", null)
      .like("postal_code", `${projectDeptPrefix}%`)
      .limit(100);
    candidates = localPros || [];
  }

  // Si peu de matches locaux, etendre France entiere (notamment GitHub-enrichis)
  if (candidates.length < 30) {
    const { data: nationalPros } = await sb
      .from("pros")
      .select("id, name, slug, postal_code, github_username, years_experience")
      .eq("category_id", input.category_id)
      .eq("source", "sirene")
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("github_username", "is", null) // priorite enrichis
      .limit(50);
    if (nationalPros) {
      // Merge sans doublons
      const seen = new Set(candidates.map((c) => c.id));
      for (const p of nationalPros) {
        if (!seen.has(p.id)) {
          candidates.push(p);
          seen.add(p.id);
        }
      }
    }
  }

  if (candidates.length === 0) return [];

  // Score
  const scored: RoutedFreelance[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    postal_code: c.postal_code,
    github_username: c.github_username,
    years_experience: c.years_experience,
    score: calculateScore({
      sameDept:
        projectDeptPrefix != null &&
        (c.postal_code || "").startsWith(projectDeptPrefix),
      hasGithub: c.github_username != null,
      yearsExperience: c.years_experience,
    }),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
