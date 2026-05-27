"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createBtpUnlockCheckoutSession } from "@/lib/stripe/create-btp-unlock-checkout";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Sprint 13 — Demarrer le checkout one-time pour debloquer un lead BTP.
 *
 * Securite (defense en profondeur) :
 *   1. Auth Supabase (user logge)
 *   2. Pro BTP claimed par cet user (category_id NOT IN AI_CATEGORY_IDS)
 *   3. Pro actif + non-deleted + non-paused
 *   4. Projet existe + vertical='btp' + pas deja unlocke par ce pro
 *      (Stripe ne facturerait pas 2x grace a la table lead_unlocks UNIQUE,
 *       mais on early-redirect pour UX)
 *
 * Idempotence :
 *   - Cote BDD : UNIQUE (project_id, pro_id) sur lead_unlocks
 *   - Cote Stripe : metadata.product='btp_lead_unlock' + metadata.project_id
 *     pour matching webhook
 */
export async function startBtpUnlock(formData: FormData): Promise<void> {
  const projectIdRaw = String(formData.get("projectId") || "");
  const projectId = parseInt(projectIdRaw, 10);
  if (isNaN(projectId) || projectId <= 0) {
    redirect("/pro/dashboard/leads?error=invalid_project");
  }

  // 1) Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/pro/connexion");

  // 2) Recup pro BTP (category_id NOT IN AI_CATEGORY_IDS)
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, name, email, category_id, stripe_customer_id, paused_until")
    .eq("claimed_by_user_id", user.id)
    .not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!pro) {
    redirect("/pro/dashboard/leads?error=no_pro");
  }

  // 3) Verifier que le pro n'a pas mis sa fiche en pause
  if (pro.paused_until && new Date(pro.paused_until) > new Date()) {
    redirect("/pro/dashboard/leads?error=paused");
  }

  // 4) Verifier que le projet existe + vertical='btp'
  const { data: project } = await service
    .from("projects")
    .select("id, vertical, status, category_id, city_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    redirect("/pro/dashboard/leads?error=project_not_found");
  }
  if (project.vertical !== "btp") {
    redirect("/pro/dashboard/leads?error=not_btp_project");
  }
  if (project.status === "deleted") {
    redirect("/pro/dashboard/leads?error=project_deleted");
  }

  // 5) Verifier que le pro n'a pas deja unlock ce projet (UX, pas securite)
  const { data: existing } = await service
    .from("lead_unlocks")
    .select("id")
    .eq("project_id", projectId)
    .eq("pro_id", pro.id)
    .maybeSingle();
  if (existing) {
    redirect(`/pro/dashboard/leads?already_unlocked=${projectId}`);
  }

  // 6) Creer la Checkout Session Stripe one-time
  const result = await createBtpUnlockCheckoutSession({
    proId: pro.id,
    projectId,
    email: pro.email || user.email,
    name: pro.name || "",
    existingCustomerId: pro.stripe_customer_id,
    successUrl: `${BASE_URL}/pro/dashboard/leads?unlocked=${projectId}`,
    cancelUrl: `${BASE_URL}/pro/dashboard/leads?canceled=${projectId}`,
  });

  if (!result.ok) {
    redirect(
      `/pro/dashboard/leads?error=${
        result.error === "stripe_not_configured"
          ? "stripe_not_configured"
          : "checkout_failed"
      }`
    );
  }

  redirect(result.url);
}
