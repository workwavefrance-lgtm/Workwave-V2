"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { localizeAiPath, type Locale } from "@/lib/i18n/config";
import { createBtpUnlockCheckoutSession } from "@/lib/stripe/create-btp-unlock-checkout";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Server Action Phase 11 (Broadcast model) :
 * Marquer un projet Workwave AI comme CONTACTE par le freelance Premium.
 *
 * Contexte : avec le modele broadcast, les `project_leads` ne sont plus
 * crees au moment du dépôt (plus de routing top 3). Ils sont crees A LA
 * VOLEE quand un freelance Premium clique "J'ai contacte ce client".
 *
 * Securite (defense en profondeur, 5 checks) :
 *   1. Auth Supabase (user logge)
 *   2. Pro Workwave AI actif claimed par cet user (14 categories AI_CATEGORY_IDS)
 *   3. Pro Premium actif (subscription_product='ai' AND status in active/trialing)
 *   4. Projet existe ET est Workwave AI (vertical='tech' = produit AI) ET pas status='deleted'
 *   5. Pas de doublon (UPSERT par (project_id, pro_id))
 *
 * Idempotent : si lead deja cree pour ce couple, no-op (skip overwrite).
 */
export async function markProjectAsContacted(formData: FormData): Promise<void> {
  // Locale-aware redirects (champ cache name="locale" pose par la page EN ;
  // defaut "fr" => comportement FR strictement inchange).
  const locale: Locale =
    String(formData.get("locale") || "fr") === "en" ? "en" : "fr";

  const projectIdRaw = String(formData.get("projectId") || "");
  const projectId = parseInt(projectIdRaw, 10);
  if (isNaN(projectId) || projectId <= 0) {
    redirect(localizeAiPath("/ai/dashboard/projets", locale) + "?error=invalid_project");
  }

  // 1) Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  // 2) Recuperer le pro tech actif de l'user + verifier Premium
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select(
      "id, category_id, claimed_by_user_id, subscription_status, subscription_product"
    )
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!pro) {
    redirect(localizeAiPath("/ai/dashboard/projets", locale) + "?error=unauthorized");
  }

  // 3) Verifier que le pro a DEBLOQUE ce projet (pay-per-lead 9,90 €).
  //    Remplace l'ancien check Premium : on ne marque "contacte" qu'apres unlock.
  const { data: unlock } = await service
    .from("lead_unlocks")
    .select("id")
    .eq("project_id", projectId)
    .eq("pro_id", pro.id)
    .maybeSingle();
  if (!unlock) {
    redirect(localizeAiPath("/ai/dashboard/projets", locale) + "?error=not_unlocked");
  }

  // 4) Verifier que le projet existe ET est Workwave AI (tech) ET pas soft-deleted
  // NB: la table `projects` n'a PAS de colonne `deleted_at` — le soft-delete
  // se fait via `status='deleted'`.
  const { data: project } = await service
    .from("projects")
    .select("id, vertical, status")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.vertical !== "tech" || project.status === "deleted") {
    redirect(localizeAiPath("/ai/dashboard/projets", locale) + "?error=project_not_found");
  }

  // 5) UPSERT : si lead existe deja pour ce couple, skip ; sinon insert + mark contacted
  const { data: existing } = await service
    .from("project_leads")
    .select("id, contacted_at")
    .eq("project_id", projectId)
    .eq("pro_id", pro.id)
    .maybeSingle();

  const nowIso = new Date().toISOString();

  if (existing) {
    // Lead existe (cas rare : ce pro avait deja ete route par l'ancien systeme
    // Phase 8, ou il a deja clique). Update si pas encore contacted.
    if (!existing.contacted_at) {
      await service
        .from("project_leads")
        .update({
          contacted_at: nowIso,
          status: "contacted",
          opened_at: nowIso,
        })
        .eq("id", existing.id);
    }
  } else {
    // Pas de lead : on cree un row a la volee pour ce couple project x pro
    await service.from("project_leads").insert({
      project_id: projectId,
      pro_id: pro.id,
      sent_at: nowIso,
      opened_at: nowIso,
      contacted_at: nowIso,
      status: "contacted",
    });
  }

  revalidatePath(localizeAiPath("/ai/dashboard/projets", locale));
  redirect(localizeAiPath("/ai/dashboard/projets", locale) + "?marked=contacted");
}

/**
 * Pay-per-lead freelance (28/06/2026) : démarrer le checkout Stripe one-time
 * pour débloquer les coordonnées d'UN projet tech. 9,90 € TTC, même infra que
 * le BTP (lead_unlocks project_id+pro_id, webhook product="btp_lead_unlock").
 *
 * Sécurité (défense en profondeur) :
 *   1. Auth Supabase
 *   2. Pro freelance actif claimed par cet user (category_id IN AI_CATEGORY_IDS)
 *   3. Projet existe + vertical='tech' + pas status='deleted'
 *   4. Pas déjà unlocké par ce pro (UX ; lead_unlocks UNIQUE garantit le reste)
 *   5. CGV acceptées au point de vente (case cochée)
 */
export async function startTechUnlock(formData: FormData): Promise<void> {
  const projectId = parseInt(String(formData.get("projectId") || ""), 10);
  if (isNaN(projectId) || projectId <= 0) {
    redirect("/ai/dashboard/projets?error=invalid_project");
  }

  // CGV obligatoire (case cochée — garde-fou anti-contournement JS/requête forgée)
  if (!formData.get("cgvAccepted")) {
    redirect("/ai/dashboard/projets?error=cgv_required");
  }

  // 1) Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/ai/connexion");

  // 2) Pro freelance (category_id IN AI_CATEGORY_IDS)
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, name, email, category_id, stripe_customer_id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect("/ai/dashboard/projets?error=unauthorized");

  // 3) Projet existe + vertical='tech' + pas soft-deleted
  const { data: project } = await service
    .from("projects")
    .select("id, vertical, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.vertical !== "tech" || project.status === "deleted") {
    redirect("/ai/dashboard/projets?error=project_not_found");
  }

  // 4) Déjà unlocké ? (UX : évite un 2e paiement, lead_unlocks UNIQUE de toute façon)
  const { data: existing } = await service
    .from("lead_unlocks")
    .select("id")
    .eq("project_id", projectId)
    .eq("pro_id", pro.id)
    .maybeSingle();
  if (existing) redirect(`/ai/dashboard/projets?already_unlocked=${projectId}`);

  // 5) Checkout one-time 9,90 € (vertical tech, même prix/infra que le BTP)
  const result = await createBtpUnlockCheckoutSession({
    proId: pro.id,
    projectId,
    email: pro.email || user.email,
    name: pro.name || "",
    existingCustomerId: pro.stripe_customer_id,
    vertical: "tech",
    successUrl: `${BASE_URL}/ai/dashboard/projets?unlocked=${projectId}`,
    cancelUrl: `${BASE_URL}/ai/dashboard/projets?canceled=${projectId}`,
  });

  if (!result.ok) {
    redirect(
      `/ai/dashboard/projets?error=${
        result.error === "stripe_not_configured"
          ? "stripe_not_configured"
          : "checkout_failed"
      }`
    );
  }

  redirect(result.url);
}
