import { createClient } from "@supabase/supabase-js";
import { haversineDistance } from "@/lib/utils/geo";
import { getLeadsReceivedLast30Days } from "@/lib/queries/leads";
import { sendLeadNotificationEmail } from "@/lib/email/send-lead-notification";
import { getResponseRatePenalty } from "@/lib/routing/response-rate";
import type { ProjectBudget } from "@/lib/types/database";

// ============================================
// Types internes
// ============================================

type RoutableProject = {
  id: number;
  category_id: number;
  description: string;
  urgency: string;
  budget: ProjectBudget;
  city: {
    name: string;
    latitude: number | null;
    longitude: number | null;
  };
  category: {
    name: string;
  };
};

type EligiblePro = {
  id: number;
  name: string;
  email: string | null;
  category_id: number;
  enabled_category_ids: number[] | null;
  intervention_radius_km: number;
  min_budget: number | null;
  paused_until: string | null;
  claimed_at: string | null;
  trial_ends_at: string | null;
  response_rate: number | null;
  city: {
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type ScoredPro = EligiblePro & {
  distance: number;
  score: number;
};

// ============================================
// Helpers
// ============================================

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function budgetToNumeric(budget: ProjectBudget): number {
  const mapping: Record<ProjectBudget, number> = {
    lt500: 0,
    "500_2000": 500,
    "2000_5000": 2000,
    "5000_15000": 5000,
    gt15000: 15000,
    unknown: 0,
  };
  return mapping[budget] ?? 0;
}

function truncateDescription(desc: string, wordCount = 50): string {
  const words = desc.split(/\s+/);
  if (words.length <= wordCount) return desc;
  return words.slice(0, wordCount).join(" ") + "\u2026";
}

function monthsSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, (now - then) / (30.44 * 24 * 60 * 60 * 1000));
}

// ============================================
// Fonction principale
// ============================================

/**
 * Route un projet vers les 3 meilleurs pros éligibles.
 * - Filtre par abonnement, catégorie, distance, pause, budget
 * - Score composite (distance 50%, équité 30%, ancienneté 20%)
 * - Insère les project_leads et envoie les emails
 */
export async function routeProjectToMatchingPros(
  projectId: number
): Promise<void> {
  const supabase = getServiceClient();

  // 1. Fetch le projet avec catégorie et ville
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, category_id, description, urgency, budget, category:categories(name), city:cities(name, latitude, longitude)")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    console.error("Routing: projet introuvable", projectId, projectError);
    return;
  }

  const typedProject = project as unknown as RoutableProject;

  if (!typedProject.city?.latitude || !typedProject.city?.longitude) {
    console.warn("Routing: ville du projet sans coordonnées GPS", projectId);
    await supabase
      .from("projects")
      .update({ status: "unrouted" })
      .eq("id", projectId);
    return;
  }

  const projectLat = typedProject.city.latitude;
  const projectLng = typedProject.city.longitude;

  // 2. Fetch les pros abonnés actifs (filtre DB)
  const { data: pros, error: prosError } = await supabase
    .from("pros")
    .select(
      "id, name, email, category_id, enabled_category_ids, intervention_radius_km, min_budget, paused_until, claimed_at, trial_ends_at, response_rate, city:cities(latitude, longitude)"
    )
    .in("subscription_status", ["trialing", "active"])
    .eq("is_active", true);

  if (prosError) {
    console.error("Routing: erreur requête pros", prosError);
    return;
  }

  if (!pros || pros.length === 0) {
    await markUnrouted(supabase, projectId, typedProject);
    return;
  }

  // 3. Filtres en JS
  const now = Date.now();
  const budgetNumeric = budgetToNumeric(typedProject.budget);

  const eligible: (EligiblePro & { distance: number })[] = [];

  for (const raw of pros) {
    const pro = raw as unknown as EligiblePro;

    // Pause
    if (pro.paused_until && new Date(pro.paused_until).getTime() > now) {
      continue;
    }

    // Catégorie : principale OU dans enabled_category_ids
    const categoryMatch =
      pro.category_id === typedProject.category_id ||
      (pro.enabled_category_ids?.includes(typedProject.category_id) ?? false);
    if (!categoryMatch) continue;

    // Budget minimum
    if (pro.min_budget !== null && budgetNumeric < pro.min_budget) {
      continue;
    }

    // Distance
    if (!pro.city?.latitude || !pro.city?.longitude) continue;

    const distance = haversineDistance(
      projectLat,
      projectLng,
      pro.city.latitude,
      pro.city.longitude
    );

    if (distance > pro.intervention_radius_km) continue;

    // Email requis pour envoyer le lead
    if (!pro.email) continue;

    eligible.push({ ...pro, distance });
  }

  if (eligible.length === 0) {
    await markUnrouted(supabase, projectId, typedProject);
    return;
  }

  // 4. Calcul des scores
  const eligibleIds = eligible.map((p) => p.id);
  const leadsMap = await getLeadsReceivedLast30Days(eligibleIds);
  const maxLeads = Math.max(...Array.from(leadsMap.values()), 0);

  const scored: ScoredPro[] = eligible.map((pro) => {
    const scoreDistance = 1 - pro.distance / pro.intervention_radius_km;

    const proLeads = leadsMap.get(pro.id) || 0;
    const scoreEquite = maxLeads === 0 ? 1 : 1 - proLeads / maxLeads;

    // Ancienneté : depuis claimed_at, ou trial_ends_at - 14j
    let subscriptionStart = pro.claimed_at;
    if (!subscriptionStart && pro.trial_ends_at) {
      subscriptionStart = new Date(
        new Date(pro.trial_ends_at).getTime() - 14 * 24 * 60 * 60 * 1000
      ).toISOString();
    }
    const scoreAnciennete = Math.min(1, monthsSince(subscriptionStart) / 12);

    const rawScore =
      0.5 * scoreDistance + 0.3 * scoreEquite + 0.2 * scoreAnciennete;

    // Pénalité taux de réponse
    const penalty = getResponseRatePenalty(pro.response_rate);
    const score = rawScore * penalty;

    return { ...pro, score };
  });

  // 5. Top 3
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, 3);

  // 6. Insert project_leads
  const nowISO = new Date().toISOString();
  const leadsToInsert = selected.map((pro) => ({
    project_id: projectId,
    pro_id: pro.id,
    status: "sent" as const,
    sent_at: nowISO,
  }));

  const { error: insertError } = await supabase
    .from("project_leads")
    .insert(leadsToInsert);

  if (insertError) {
    console.error("Routing: erreur insertion project_leads", insertError);
  }

  // 7. Update statut projet → routed
  await supabase
    .from("projects")
    .update({ status: "routed" })
    .eq("id", projectId);

  // 8. Envoi emails aux pros (non-bloquant)
  const descPreview = truncateDescription(typedProject.description);

  for (const pro of selected) {
    sendLeadNotificationEmail({
      email: pro.email!,
      proName: pro.name,
      categoryName: typedProject.category.name,
      cityName: typedProject.city.name,
      urgency: typedProject.urgency,
      budget: typedProject.budget,
      descriptionPreview: descPreview,
    }).catch((err) =>
      console.error(`Routing: erreur email pro ${pro.id}:`, err)
    );
  }

  console.log(
    `Routing: projet ${projectId} routé vers ${selected.length} pro(s): [${selected.map((p) => p.id).join(", ")}]`
  );
}

// ============================================
// Cas 0 pro éligible
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function markUnrouted(
  supabase: any,
  projectId: number,
  project: RoutableProject
) {
  await supabase
    .from("projects")
    .update({ status: "unrouted" })
    .eq("id", projectId);

  // Email alerte admin
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Workwave <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL || "admin@workwave.fr",
      subject: `[Workwave Alert] Projet orphelin — ${project.category.name} à ${project.city.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0A0A0A;">Projet orphelin</h2>
          <p>Aucun pro éligible trouvé pour le projet #${projectId}.</p>
          <p><strong>Catégorie :</strong> ${project.category.name}</p>
          <p><strong>Ville :</strong> ${project.city.name}</p>
          <p>Veuillez router ce projet manuellement ou élargir la couverture.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Routing: erreur envoi alerte admin projet orphelin:", err);
  }

  console.log(`Routing: projet ${projectId} marqué unrouted (0 pro éligible)`);
}
