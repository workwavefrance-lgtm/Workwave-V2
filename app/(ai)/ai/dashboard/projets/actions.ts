"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS, isAiPremium } from "@/lib/ai/helpers";

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
 *   4. Projet existe ET est Workwave AI (vertical='tech' = produit AI, deleted_at IS NULL)
 *   5. Pas de doublon (UPSERT par (project_id, pro_id))
 *
 * Idempotent : si lead deja cree pour ce couple, no-op (skip overwrite).
 */
export async function markProjectAsContacted(formData: FormData): Promise<void> {
  const projectIdRaw = String(formData.get("projectId") || "");
  const projectId = parseInt(projectIdRaw, 10);
  if (isNaN(projectId) || projectId <= 0) {
    redirect("/ai/dashboard/projets?error=invalid_project");
  }

  // 1) Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

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
    redirect("/ai/dashboard/projets?error=unauthorized");
  }

  // 3) Verifier Premium (seuls les Premium peuvent marquer comme contacte)
  if (!isAiPremium(pro)) {
    redirect("/ai/dashboard/abonnement?error=premium_required");
  }

  // 4) Verifier que le projet existe ET est tech
  const { data: project } = await service
    .from("projects")
    .select("id, vertical, deleted_at")
    .eq("id", projectId)
    .maybeSingle();

  if (!project || project.vertical !== "tech" || project.deleted_at) {
    redirect("/ai/dashboard/projets?error=project_not_found");
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

  revalidatePath("/ai/dashboard/projets");
  redirect("/ai/dashboard/projets?marked=contacted");
}
