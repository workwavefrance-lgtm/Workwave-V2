"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Update profil freelance Workwave AI.
 * Securite : verifie que l'user connecte possede bien la fiche pros tech
 * concernee (claimed_by_user_id == auth.uid AND category_id in tech).
 */
export async function updateAiProfile(formData: FormData): Promise<void> {
  // 1) Verifier auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/ai/connexion");

  // 2) Recuperer pro tech de l'user
  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id, category_id, claimed_by_user_id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (!pro) redirect("/ai/connexion?error=no_pro");

  // 3) Valider + sanitize les inputs
  const name = String(formData.get("name") || "").trim().slice(0, 200);
  const description = String(formData.get("description") || "").trim().slice(0, 500);
  const skills = String(formData.get("skills") || "").trim().slice(0, 500);
  const github = String(formData.get("github_username") || "")
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const linkedin = String(formData.get("linkedin") || "").trim().slice(0, 300);
  const yearsRaw = String(formData.get("years_experience") || "").trim();
  const rateRaw = String(formData.get("hourly_rate") || "").trim();

  const years = yearsRaw ? Math.min(50, Math.max(0, parseInt(yearsRaw, 10) || 0)) : null;
  const rate = rateRaw ? Math.min(5000, Math.max(50, parseInt(rateRaw, 10) || 0)) : null;

  // 4) Update via service (bypass RLS, mais on a deja check ownership ci-dessus)
  await service
    .from("pros")
    .update({
      name: name || undefined,
      description: description || null,
      skills: skills || null,
      github_username: github || null,
      linkedin: linkedin || null,
      years_experience: years,
      hourly_rate: rate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  // 5) Revalidate la page publique du freelance pour ISR
  // TODO : recuperer slug et revalidate /ai/freelance/${slug}
  revalidatePath("/ai/dashboard/profil");

  redirect("/ai/dashboard/profil?saved=1");
}
