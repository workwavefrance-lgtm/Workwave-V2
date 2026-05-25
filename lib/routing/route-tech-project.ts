/**
 * Routing des projets tech (vertical='tech') vers les 3 meilleurs
 * freelances eligibles (Phase 8 — avec subscription Premium boost).
 *
 * Criteres de matching :
 *   - category_id matches (filtre dur)
 *   - is_active = true, deleted_at IS NULL (filtre dur)
 *   - Score compose :
 *      + 100 pts si abonne Premium AI actif (subscription Premium boost)
 *      + 30 pts si pause active OU pas (filtre dur sur paused_until)
 *      + 50 pts si postal_code commence par meme prefix dept que le projet
 *      + 30 pts si github_username non null (signal qualite)
 *      + jusqu'a 20 pts pour years_experience (0-20 ans, ratio)
 *
 *   Tri par score desc, top 3 retenus.
 *
 * Si freelance Premium dans le top 3, il recoit un email avec le projet
 * (cf. send-ai-project-to-freelance.ts). Les non-abonnes voient le projet
 * uniquement via leur dashboard /ai/dashboard/projets (read-only).
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
  email: string | null;
  subscription_status: string | null;
  subscription_product: string | null;
  isPremium: boolean;
  score: number;
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function calculateScore(opts: {
  isPremium: boolean;
  sameDept: boolean;
  hasGithub: boolean;
  yearsExperience: number | null;
}): number {
  let score = 0;
  // Phase 8 : boost massif si Premium AI -> priorise les abonnes payants
  if (opts.isPremium) score += 100;
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
  type CandidateRow = {
    id: number;
    name: string;
    slug: string;
    postal_code: string | null;
    github_username: string | null;
    years_experience: number | null;
    email: string | null;
    subscription_status: string | null;
    subscription_product: string | null;
    paused_until: string | null;
  };
  let candidates: CandidateRow[] = [];
  const PRO_SELECT =
    "id, name, slug, postal_code, github_username, years_experience, email, subscription_status, subscription_product, paused_until";

  if (projectDeptPrefix) {
    const { data: localPros } = await sb
      .from("pros")
      .select(PRO_SELECT)
      .eq("category_id", input.category_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .like("postal_code", `${projectDeptPrefix}%`)
      .limit(100);
    candidates = (localPros || []) as CandidateRow[];
  }

  // Si peu de matches locaux, etendre France entiere
  if (candidates.length < 30) {
    const { data: nationalPros } = await sb
      .from("pros")
      .select(PRO_SELECT)
      .eq("category_id", input.category_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("github_username", "is", null) // priorite enrichis
      .limit(50);
    if (nationalPros) {
      const seen = new Set(candidates.map((c) => c.id));
      for (const p of nationalPros as CandidateRow[]) {
        if (!seen.has(p.id)) {
          candidates.push(p);
          seen.add(p.id);
        }
      }
    }
  }

  // Aussi : on cherche TOUS les abonnes Premium AI actifs dans cette categorie,
  // peu importe le dept. Ils ont priorite max.
  const { data: premiumPros } = await sb
    .from("pros")
    .select(PRO_SELECT)
    .eq("category_id", input.category_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .eq("subscription_product", "ai")
    .in("subscription_status", ["active", "trialing"])
    .limit(50);
  if (premiumPros) {
    const seen = new Set(candidates.map((c) => c.id));
    for (const p of premiumPros as CandidateRow[]) {
      if (!seen.has(p.id)) {
        candidates.push(p);
        seen.add(p.id);
      }
    }
  }

  if (candidates.length === 0) return [];

  // Filtre dur : exclure ceux en pause
  const now = new Date();
  const eligible = candidates.filter((c) => {
    if (!c.paused_until) return true;
    return new Date(c.paused_until) < now;
  });

  // Score
  const scored: RoutedFreelance[] = eligible.map((c) => {
    const isPremium =
      c.subscription_product === "ai" &&
      (c.subscription_status === "active" || c.subscription_status === "trialing");
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      postal_code: c.postal_code,
      github_username: c.github_username,
      years_experience: c.years_experience,
      email: c.email,
      subscription_status: c.subscription_status,
      subscription_product: c.subscription_product,
      isPremium,
      score: calculateScore({
        isPremium,
        sameDept:
          projectDeptPrefix != null &&
          (c.postal_code || "").startsWith(projectDeptPrefix),
        hasGithub: c.github_username != null,
        yearsExperience: c.years_experience,
      }),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
