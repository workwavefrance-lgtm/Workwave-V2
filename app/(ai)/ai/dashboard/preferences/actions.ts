"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { localizeAiPath, type Locale } from "@/lib/i18n/config";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function updateAiPreferences(formData: FormData): Promise<void> {
  // Locale-aware redirects (champ cache name="locale" pose par la page EN ;
  // defaut "fr" => comportement FR strictement inchange).
  const locale: Locale =
    String(formData.get("locale") || "fr") === "en" ? "en" : "fr";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localizeAiPath("/ai/connexion", locale));

  const service = getServiceClient();
  const { data: pro } = await service
    .from("pros")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pro) redirect(localizeAiPath("/ai/connexion", locale) + "?error=no_pro");

  // Parse + validate
  const remoteRaw = String(formData.get("available_for_remote") || "");
  const availableForRemote = remoteRaw === "true" ? true : remoteRaw === "false" ? false : null;

  const minBudgetRaw = String(formData.get("min_budget") || "").trim();
  const minBudget = minBudgetRaw
    ? Math.min(500000, Math.max(0, parseInt(minBudgetRaw, 10) || 0))
    : null;

  const pausedRaw = String(formData.get("paused_until") || "").trim();
  let pausedUntil: string | null = null;
  if (pausedRaw) {
    const d = new Date(pausedRaw);
    if (isNaN(d.getTime())) {
      // Date format invalide (HTML5 date input devrait pas le permettre, mais
      // securisons)
      redirect(localizeAiPath("/ai/dashboard/preferences", locale) + "?error=invalid_date");
    }
    if (d <= new Date()) {
      // Fix #11 : on retourne une erreur UI claire au lieu d'ignorer silent
      redirect(localizeAiPath("/ai/dashboard/preferences", locale) + "?error=paused_until_past");
    }
    pausedUntil = d.toISOString();
  }

  await service
    .from("pros")
    .update({
      available_for_remote: availableForRemote,
      min_budget: minBudget,
      paused_until: pausedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pro.id);

  // NOTE : pas de revalidatePath sur cette meme page (cf. lecon 28/04 CLAUDE.md).
  // Le redirect cause un re-fetch RSC propre, et les inputs uncontrolled prennent
  // les nouvelles valeurs depuis la BDD a l'arrivee sur la page.
  redirect(localizeAiPath("/ai/dashboard/preferences", locale) + "?saved=1");
}
